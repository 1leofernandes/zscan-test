import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateUnavailabilityDto, UpdateUnavailabilityDto, UnavailabilityResponseDto } from './unavailability.dto';
import { format, parse } from 'date-fns';

@Injectable()
export class UnavailabilityService {
  private readonly logger = new Logger(UnavailabilityService.name);

  constructor(private readonly dataSource: DataSource) {}

  async create(
    createUnavailabilityDto: CreateUnavailabilityDto,
    tenantSchema: string,
    userId: string,
  ): Promise<UnavailabilityResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const result = await queryRunner.query(
        `INSERT INTO ${tenantSchema}.unavailabilities (
          professional_id, professional_name, type, title, description,
          start_time, end_time, is_all_day,
          resource_room, recurring, recurrence_pattern, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *`,
        [
          createUnavailabilityDto.professionalId,
          createUnavailabilityDto.professionalName,
          createUnavailabilityDto.type,
          createUnavailabilityDto.title || null,
          createUnavailabilityDto.description || null,
          createUnavailabilityDto.startTime || null,
          createUnavailabilityDto.endTime || null,
          createUnavailabilityDto.isAllDay ?? true,
          createUnavailabilityDto.resourceRoom || null,
          createUnavailabilityDto.recurring ?? false,
          createUnavailabilityDto.recurrencePattern || null,
          userId,
        ],
      );

      this.logger.log(
        `Unavailability created: ${result[0].id} - Professional: ${createUnavailabilityDto.professionalId}`,
      );

      return this.mapToResponse(result[0]);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    tenantSchema: string,
    professionalId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    let query = `SELECT * FROM ${tenantSchema}.unavailabilities WHERE 1=1`;
    const params: any[] = [];

    if (professionalId) {
      query += ` AND professional_id = $${params.length + 1}`;
      params.push(professionalId);
    }

    if (startDate) {
      query += ` AND start_time >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND end_time <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ' ORDER BY start_time ASC';

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const result = await queryRunner.query(query, params);
      return result.map(this.mapToResponse);
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string, tenantSchema: string): Promise<UnavailabilityResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const result = await queryRunner.query(
        `SELECT * FROM ${tenantSchema}.unavailabilities WHERE id = $1`,
        [id],
      );

      if (result.length === 0) {
        throw new NotFoundException('Unavailability not found');
      }

      return this.mapToResponse(result[0]);
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    tenantSchema: string,
    updateUnavailabilityDto: UpdateUnavailabilityDto,
    userId: string,
  ): Promise<UnavailabilityResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updateUnavailabilityDto.type) {
        updates.push(`type = $${paramIndex++}`);
        params.push(updateUnavailabilityDto.type);
      }
      if (updateUnavailabilityDto.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        params.push(updateUnavailabilityDto.title);
      }
      if (updateUnavailabilityDto.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(updateUnavailabilityDto.description);
      }
      if (updateUnavailabilityDto.startTime !== undefined) {
        updates.push(`start_time = $${paramIndex++}`);
        params.push(updateUnavailabilityDto.startTime);
      }
      if (updateUnavailabilityDto.endTime !== undefined) {
        updates.push(`end_time = $${paramIndex++}`);
        params.push(updateUnavailabilityDto.endTime);
      }
      if (updateUnavailabilityDto.isAllDay !== undefined) {
        updates.push(`is_all_day = $${paramIndex++}`);
        params.push(updateUnavailabilityDto.isAllDay);
      }

      updates.push(`updated_by = $${paramIndex++}`);
      params.push(userId);
      updates.push(`updated_at = NOW()`);

      params.push(id);

      const result = await queryRunner.query(
        `UPDATE ${tenantSchema}.unavailabilities 
         SET ${updates.join(', ')} 
         WHERE id = $${paramIndex}
         RETURNING *`,
        params,
      );

      if (result.length === 0) {
        throw new NotFoundException('Unavailability not found');
      }

      return this.mapToResponse(result[0]);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string, tenantSchema: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const result = await queryRunner.query(
        `DELETE FROM ${tenantSchema}.unavailabilities WHERE id = $1`,
        [id],
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException('Unavailability not found');
      }

      this.logger.log(`Unavailability deleted: ${id}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string, tenantSchema: string): Promise<void> {
    const result = await this.dataSource.query(
      `UPDATE ${tenantSchema}.unavailabilities 
      SET deleted_at = NOW() 
      WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.length === 0) {
      throw new NotFoundException('Unavailability not found');
    }
  }

  private mapToResponse(data: any): UnavailabilityResponseDto {
    return {
      id: data.id,
      professionalId: data.professional_id,
      professionalName: data.professional_name,
      type: data.type,
      title: data.title,
      description: data.description,
      startTime: data.start_time,
      endTime: data.end_time,
      isAllDay: data.is_all_day,
      resourceRoom: data.resource_room,
      recurring: data.recurring,
      recurrencePattern: data.recurrence_pattern,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
