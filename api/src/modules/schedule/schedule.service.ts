import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  UpdateScheduleStatusDto,
  ScheduleFilterDto,
  ScheduleResponseDto,
  ScheduleStatus,
  AgendaDayViewDto,
  AgendaWeekViewDto,
  AvailabilityResponseDto,
} from './schedule.dto';
import { addDays, startOfDay, endOfDay, eachDayOfInterval, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Create a new schedule/appointment
   */
  async create(
    createScheduleDto: CreateScheduleDto,
    tenantSchema: string,
    userId: string,
  ): Promise<ScheduleResponseDto> {
    // Validate times
    const startTime = new Date(createScheduleDto.startTime);
    const endTime = new Date(createScheduleDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for conflicts
    const conflicts = await this.checkConflicts(
      tenantSchema,
      createScheduleDto.professionalId,
      createScheduleDto.startTime,
      createScheduleDto.endTime,
    );

    if (conflicts.length > 0) {
      throw new ConflictException('Time slot conflicts with existing appointment');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const result = await queryRunner.query(
        `INSERT INTO ${tenantSchema}.schedules (
          patient_id, professional_id, professional_name, resource_room, procedure_type,
          start_time, end_time, status, origin, notes,
          created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id, patient_id, professional_name, procedure_type, start_time, end_time, status, 
                  origin, created_at, updated_at`,
        [
          createScheduleDto.patientId,
          createScheduleDto.professionalId,
          createScheduleDto.professionalName,
          createScheduleDto.resourceRoom || null,
          createScheduleDto.procedureType,
          startTime,
          endTime,
          createScheduleDto.status || ScheduleStatus.SCHEDULED,
          createScheduleDto.origin || 'in_person',
          createScheduleDto.notes || null,
          // createScheduleDto.patientInstructions || null,
          userId,
        ],
      );

      this.logger.log(
        `Schedule created: ${result[0].id} - Patient: ${createScheduleDto.patientId}`,
      );

      // Clear relevant caches
      await this.clearAgendaCaches(tenantSchema);

      // Get patient name for response
      const patientResult = await queryRunner.query(
        `SELECT full_name FROM ${tenantSchema}.patients WHERE id = $1`,
        [createScheduleDto.patientId],
      );

      return this.mapToResponse({
        ...result[0],
        patient_id: createScheduleDto.patientId,
        patient_name: patientResult[0]?.full_name || 'Unknown',
      });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all schedules with filters
   */
  async findAll(tenantSchema: string, filters: ScheduleFilterDto) {
    let query = `SELECT s.id, s.patient_id, p.full_name as patient_name, s.professional_name, 
                        s.procedure_type, s.start_time, s.end_time, s.status, s.origin,
                        s.created_at, s.updated_at
                 FROM ${tenantSchema}.schedules s
                 LEFT JOIN ${tenantSchema}.patients p ON s.patient_id = p.id
                 WHERE 1=1`;

    const params: any[] = [];

    if (filters.dateStart) {
      query += ` AND s.start_time >= $${params.length + 1}`;
      params.push(filters.dateStart);
    }

    if (filters.dateEnd) {
      query += ` AND s.end_time <= $${params.length + 1}`;
      params.push(addDays(parse(filters.dateEnd, 'yyyy-MM-dd', new Date()), 1));
    }

    if (filters.professionalIds && filters.professionalIds.length > 0) {
      const placeholders = filters.professionalIds
        .map((_, i) => `$${params.length + i + 1}`)
        .join(',');
      query += ` AND s.professional_id IN (${placeholders})`;
      params.push(...filters.professionalIds);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      const placeholders = filters.statuses
        .map((_, i) => `$${params.length + i + 1}`)
        .join(',');
      query += ` AND s.status IN (${placeholders})`;
      params.push(...filters.statuses);
    }

    if (filters.procedureType) {
      query += ` AND s.procedure_type = $${params.length + 1}`;
      params.push(filters.procedureType);
    }

    query += ` ORDER BY s.start_time ASC`;
    const limit = Math.min(filters.pageSize || 50, 100);
    query += ` LIMIT $${params.length + 1}`;
    params.push(limit);

    const schedules = await this.dataSource.query(query, params);
    return schedules.map((s: any) => this.mapToResponse(s));
  }

  /**
   * Get ALL schedules without filters (for debugging)
   */
  async getAllSchedules(tenantSchema: string) {
    const query = `SELECT s.id, s.patient_id, p.full_name as patient_name, s.professional_id, s.professional_name, 
                          s.procedure_type, s.start_time, s.end_time, s.status, s.origin,
                          s.created_at, s.updated_at
                   FROM ${tenantSchema}.schedules s
                   LEFT JOIN ${tenantSchema}.patients p ON s.patient_id = p.id
                   ORDER BY s.start_time DESC`;

    const schedules = await this.dataSource.query(query);
    this.logger.debug(`Found ${schedules.length} total schedules in ${tenantSchema}`);
    
    return {
      total: schedules.length,
      schedules: schedules.map((s: any) => this.mapToResponse(s)),
    };
  }

  /**
   * Get agenda for a specific day
   */
  async getAgendaDayView(
    tenantSchema: string,
    date: string,
    filters?: ScheduleFilterDto,
  ): Promise<AgendaDayViewDto> {
    const startOfDayDate = startOfDay(parse(date, 'yyyy-MM-dd', new Date()));
    const endOfDayDate = endOfDay(parse(date, 'yyyy-MM-dd', new Date()));

    this.logger.debug(
      `Getting agenda for ${date}: from ${startOfDayDate.toISOString()} to ${endOfDayDate.toISOString()}`
    );

    let query = `SELECT s.id, s.patient_id, p.full_name as patient_name, s.professional_id, s.professional_name, 
                        s.procedure_type, s.start_time, s.end_time, s.status, s.origin,
                        s.created_at, s.updated_at
                 FROM ${tenantSchema}.schedules s
                 LEFT JOIN ${tenantSchema}.patients p ON s.patient_id = p.id
                 WHERE s.start_time >= $1 AND s.start_time < $2`;

    const params: any[] = [startOfDayDate, endOfDayDate];

    if (filters?.professionalIds && filters.professionalIds.length > 0) {
      const placeholders = filters.professionalIds
        .map((_, i) => `$${params.length + i + 1}`)
        .join(',');
      query += ` AND s.professional_id IN (${placeholders})`;
      params.push(...filters.professionalIds);
    }

    if (filters?.statuses && filters.statuses.length > 0) {
      const placeholders = filters.statuses
        .map((_, i) => `$${params.length + i + 1}`)
        .join(',');
      query += ` AND s.status IN (${placeholders})`;
      params.push(...filters.statuses);
    }

    query += ` ORDER BY s.start_time ASC`;

    const schedules = await this.dataSource.query(query, params);

    this.logger.debug(`Found ${schedules.length} schedules for ${date}`);

    const totalSlots = 8 * 4; // 8 hours * 4 slots per hour (15min slots)
    const bookedSlots = schedules.length;

    return {
      date: format(startOfDayDate, 'yyyy-MM-dd'),
      dayOfWeek: format(startOfDayDate, 'EEEE', { locale: ptBR }),
      schedules: schedules.map((s: any) => this.mapToResponse(s)),
      stats: {
        total: schedules.length,
        booked: schedules.filter((s: any) => s.status === 'confirmed').length,
        available: totalSlots - bookedSlots,
      },
    };
  }

  /**
   * Get agenda for a week
   */
  async getAgendaWeekView(
    tenantSchema: string,
    startDate: string,
    filters?: ScheduleFilterDto,
  ): Promise<AgendaWeekViewDto> {
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const weekEnd = addDays(start, 6);

    const daysInWeek = eachDayOfInterval({
      start: startOfDay(start),
      end: startOfDay(weekEnd),
    });

    const days: AgendaDayViewDto[] = await Promise.all(
      daysInWeek.map((day: any) =>
        this.getAgendaDayView(tenantSchema, format(day, 'yyyy-MM-dd'), filters),
      ),
    );

    return {
      weekStart: format(start, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      days,
    };
  }

  /**
   * Check availability for professional
   */
  async getAvailability(
    tenantSchema: string,
    professionalId: string,
    date: string,
    slotDurationMinutes: number = 30,
  ): Promise<AvailabilityResponseDto> {
    const startOfDayDate = startOfDay(parse(date, 'yyyy-MM-dd', new Date()));
    const endOfDayDate = endOfDay(parse(date, 'yyyy-MM-dd', new Date()));

    // Get all schedules for this professional on this date
    const schedules = await this.dataSource.query(
      `SELECT start_time, end_time FROM ${tenantSchema}.schedules
       WHERE professional_id = $1 AND start_time >= $2 AND end_time <= $3
       ORDER BY start_time ASC`,
      [professionalId, startOfDayDate, endOfDayDate],
    );

    // Generate time slots for business hours (08:00 - 18:00)
    const slots = this.generateTimeSlots(slotDurationMinutes);

    // Mark occupied slots
    const availableSlots = slots.map((slot) => {
      const isAvailable = !schedules.some((s: any) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const schedStart = new Date(s.start_time);
        const schedEnd = new Date(s.end_time);
        return slotStart < schedEnd && slotEnd > schedStart;
      });

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: isAvailable,
      };
    });

    return {
      professionalId,
      date: format(startOfDayDate, 'yyyy-MM-dd'),
      slots: availableSlots,
    };
  }

  /**
   * Update schedule
   */
  async update(
    id: string,
    tenantSchema: string,
    updateScheduleDto: UpdateScheduleDto,
    userId: string,
  ): Promise<ScheduleResponseDto> {
    // Get existing schedule
    const existing = await this.findOne(id, tenantSchema);

    if (updateScheduleDto.startTime || updateScheduleDto.endTime) {
      const startTime = new Date(updateScheduleDto.startTime || existing.startTime);
      const endTime = new Date(updateScheduleDto.endTime || existing.endTime);

      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }

      // Check for conflicts (excluding current schedule)
      const conflicts = await this.dataSource.query(
        `SELECT id FROM ${tenantSchema}.schedules
         WHERE id != $1 AND professional_id = $2 
         AND start_time < $3 AND end_time > $4`,
        [id, updateScheduleDto.professionalId || existing.professionalId, startTime, endTime],
      );

      if (conflicts.length > 0) {
        throw new ConflictException('New time slot conflicts with existing appointment');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateScheduleDto.startTime) {
        updates.push(`start_time = $${paramCount++}`);
        values.push(updateScheduleDto.startTime);
      }

      if (updateScheduleDto.endTime) {
        updates.push(`end_time = $${paramCount++}`);
        values.push(updateScheduleDto.endTime);
      }

      if (updateScheduleDto.status) {
        updates.push(`status = $${paramCount++}`);
        values.push(updateScheduleDto.status);
      }

      if (updateScheduleDto.notes) {
        updates.push(`notes = $${paramCount++}`);
        values.push(updateScheduleDto.notes);
      }

      updates.push(`updated_by = $${paramCount++}`);
      values.push(userId);

      updates.push(`updated_at = NOW()`);

      values.push(id);

      const result = await queryRunner.query(
        `UPDATE ${tenantSchema}.schedules SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values,
      );

      this.logger.log(`Schedule updated: ${id}`);

      // Clear agenda caches
      await this.clearAgendaCaches(tenantSchema);

      return this.mapToResponse(result[0]);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update schedule status
   */
  async updateStatus(
    id: string,
    tenantSchema: string,
    statusDto: UpdateScheduleStatusDto,
    userId: string,
  ): Promise<ScheduleResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const result = await queryRunner.query(
        `UPDATE ${tenantSchema}.schedules 
         SET status = $1, notes = COALESCE($2, notes), updated_by = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [statusDto.status, statusDto.notes, userId, id],
      );

      if (!result || result.length === 0) {
        throw new NotFoundException('Schedule not found');
      }

      this.logger.log(`Schedule status updated: ${id} -> ${statusDto.status}`);

      // Clear agenda caches
      await this.clearAgendaCaches(tenantSchema);

      return this.mapToResponse(result[0]);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find schedule by ID
   */
  async findOne(id: string, tenantSchema: string): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT * FROM ${tenantSchema}.schedules WHERE id = $1`,
      [id],
    );

    if (!result || result.length === 0) {
      throw new NotFoundException('Schedule not found');
    }

    return this.mapToResponse(result[0]);
  }

  /**
   * Private helper methods
   */

  private async checkConflicts(
    tenantSchema: string,
    professionalId: string,
    startTime: string,
    endTime: string,
  ) {
    return this.dataSource.query(
      `SELECT id FROM ${tenantSchema}.schedules
       WHERE professional_id = $1
       AND status NOT IN ('cancelled', 'no_show')
       AND start_time < $2 AND end_time > $3`,
      [professionalId, new Date(endTime), new Date(startTime)],
    );
  }

  private async checkUnavailability(
    tenantSchema: string,
    professionalId: string,
    startTime: string,
    endTime: string,
  ) {
    return this.dataSource.query(
      `SELECT id, type, start_time, end_time FROM ${tenantSchema}.unavailabilities
       WHERE professional_id = $1
       AND deleted_at IS NULL
       AND (
         (is_all_day = true)
         OR (start_time < $2 AND end_time > $3)
       )`,
      [professionalId, new Date(endTime), new Date(startTime)],
    );
  }

  async validateSchedule(
    tenantSchema: string,
    professionalId: string,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string,
  ) {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (startDate >= endDate) {
      return {
        valid: false,
        errors: ['Start time must be before end time'],
        conflicts: [],
        unavailabilities: [],
      };
    }

    // Check for conflicting schedules
    let conflictQuery = `SELECT id, patient_id, professional_id, start_time, end_time, status
       FROM ${tenantSchema}.schedules
       WHERE professional_id = $1
       AND status NOT IN ('cancelled', 'no_show')
       AND start_time < $2 AND end_time > $3`;

    const conflictParams: any[] = [professionalId, endDate, startDate];

    if (excludeScheduleId) {
      conflictQuery += ` AND id != $${conflictParams.length + 1}`;
      conflictParams.push(excludeScheduleId);
    }

    const conflicts = await this.dataSource.query(conflictQuery, conflictParams);

    // Check for unavailabilities
    const unavailabilities = await this.checkUnavailability(
      tenantSchema,
      professionalId,
      startTime,
      endTime,
    );

    const errors: string[] = [];

    if (conflicts.length > 0) {
      errors.push(
        `Conflito de horário com ${conflicts.length} agendamento(s) existente(s)`
      );
    }

    if (unavailabilities.length > 0) {
      const types = unavailabilities.map((u: any) => u.type).join(', ');
      errors.push(`Período indisponível (${types})`);
    }

    return {
      valid: errors.length === 0,
      errors,
      conflicts: conflicts.map((c: any) => ({
        id: c.id,
        startTime: c.start_time,
        endTime: c.end_time,
      })),
      unavailabilities: unavailabilities.map((u: any) => ({
        id: u.id,
        type: u.type,
        startTime: u.start_time,
        endTime: u.end_time,
      })),
    };
  }

  private generateTimeSlots(durationMinutes: number = 30) {
    const slots = [];
    const startHour = 8; // 08:00
    const endHour = 18; // 18:00

    let currentTime = new Date();
    currentTime.setHours(startHour, 0, 0, 0);

    while (currentTime.getHours() < endHour) {
      const endTime = new Date(currentTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      slots.push({
        startTime: new Date(currentTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      currentTime = endTime;
    }

    return slots;
  }

  private mapToResponse(schedule: any): ScheduleResponseDto {
    return {
      id: schedule.id,
      patientId: schedule.patient_id,
      patientName: schedule.patient_name || 'Unknown',
      professionalId: schedule.professional_id,
      professionalName: schedule.professional_name,
      procedureType: schedule.procedure_type,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      status: schedule.status,
      origin: schedule.origin,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at,
    };
  }

  private async clearAgendaCaches(tenantSchema: string) {
    const pattern = `agenda:*:${tenantSchema}`;
    // Note: simple cache invalidation - in production, use Redis SCAN
    await this.cacheManager.del(`agenda:day:${tenantSchema}`);
    await this.cacheManager.del(`agenda:week:${tenantSchema}`);
  }

  async reschedule(
    id: string,
    tenantSchema: string,
    newStartTime: string,
    newEndTime: string,
    userId: string,
  ): Promise<ScheduleResponseDto> {
    this.logger.log(`
╔════════════════════════════════════════════════════════╗
║           RESCHEDULE REQUEST RECEIVED                   ║
╚════════════════════════════════════════════════════════╝
Schedule ID: ${id}
Tenant: ${tenantSchema}
User ID: ${userId}
═══════════════════════════════════════════════════════
New Start (from frontend ISO): ${newStartTime}
New End (from frontend ISO):   ${newEndTime}
═══════════════════════════════════════════════════════
    `);

    // Verificar se o agendamento existe
    const existing = await this.dataSource.query(
      `SELECT id, professional_id, start_time, end_time FROM ${tenantSchema}.schedules WHERE id = $1`,
      [id],
    );

    if (!existing || existing.length === 0) {
      throw new NotFoundException('Schedule not found');
    }

    const professionalId = existing[0].professional_id;
    this.logger.log(`Found existing schedule:
  Current Start: ${existing[0].start_time}
  Current End: ${existing[0].end_time}
  Professional ID: ${professionalId}`);

    // Verificar conflitos
    const conflicts = await this.dataSource.query(
      `SELECT id, start_time, end_time FROM ${tenantSchema}.schedules
      WHERE id != $1 AND professional_id = $2
      AND start_time < $3 AND end_time > $4
      AND status NOT IN ('cancelled', 'no_show')`,
      [id, professionalId, newEndTime, newStartTime],
    );

    if (conflicts.length > 0) {
      this.logger.warn(`Conflict detected for schedule ${id}:
      ${conflicts.map((c: any) => `  ${c.start_time} - ${c.end_time}`).join('\n')}`);
      throw new ConflictException('Horário conflita com outro agendamento');
    }

    // Fazer o update
    const updateResult = await this.dataSource.query(
      `UPDATE ${tenantSchema}.schedules
      SET start_time = $1, end_time = $2, updated_at = NOW(), updated_by = $3
      WHERE id = $4
      RETURNING id, start_time, end_time`,
      [newStartTime, newEndTime, userId, id],
    );

    if (!updateResult || updateResult.length === 0) {
      this.logger.error(`Update failed for schedule ${id}`);
      throw new Error('Failed to update schedule');
    }

    this.logger.log(`Schedule ${id} updated successfully:
  New Start: ${updateResult[0].start_time}
  New End: ${updateResult[0].end_time}`);

    // Limpar cache
    await this.clearAgendaCaches(tenantSchema);

    const result = await this.findOne(id, tenantSchema);
    
    this.logger.log(`
╔════════════════════════════════════════════════════════╗
║           RESCHEDULE COMPLETED                         ║
╚════════════════════════════════════════════════════════╝
Returned from API:
  Start: ${result.startTime}
  End: ${result.endTime}
═══════════════════════════════════════════════════════
    `);

    return result;
  }
}
