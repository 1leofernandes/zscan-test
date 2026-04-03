import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { CreatePatientDto, UpdatePatientDto, PatientResponseDto } from './patients.dto';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Create a new patient
   */
  async create(createPatientDto: CreatePatientDto, tenantSchema: string, userId: string): Promise<PatientResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Validate CPF uniqueness
      const existingPatient = await queryRunner.query(
        `SELECT id FROM ${tenantSchema}.patients WHERE cpf = $1 LIMIT 1`,
        [createPatientDto.cpf],
      );

      if (existingPatient && existingPatient.length > 0) {
        throw new BadRequestException('Patient with this CPF already exists');
      }

      // Validate CNS if provided
      if (createPatientDto.cns) {
        const existingCNS = await queryRunner.query(
          `SELECT id FROM ${tenantSchema}.patients WHERE cns = $1 LIMIT 1`,
          [createPatientDto.cns],
        );

        if (existingCNS && existingCNS.length > 0) {
          throw new BadRequestException('Patient with this CNS already exists');
        }
      }

      // Calculate age for validation
      const birthDate = new Date(createPatientDto.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 150) {
        throw new BadRequestException('Invalid date of birth');
      }

      const result = await queryRunner.query(
        `INSERT INTO ${tenantSchema}.patients (
          full_name, date_of_birth, cpf, cns, gender, phone_primary, phone_secondary,
          email, address, health_plan_id, clinical_notes, is_active, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, NOW(), NOW())
        RETURNING id, full_name, date_of_birth, cpf, cns, gender, phone_primary, phone_secondary, email, address, health_plan_id, clinical_notes, is_active, created_at, updated_at, created_by`,
        [
          createPatientDto.fullName,
          createPatientDto.dateOfBirth,
          createPatientDto.cpf,
          createPatientDto.cns || null,
          createPatientDto.gender,
          createPatientDto.phonePrimary,
          createPatientDto.phoneSecondary || null,
          createPatientDto.email || null,
          JSON.stringify(createPatientDto.address),
          createPatientDto.healthPlanId || null,
          createPatientDto.clinicalNotes || null,
          userId,
        ],
      );

      const patient = result[0];
      this.logger.log(`Patient created: ${patient.id} - CPF: ${createPatientDto.cpf}`);

      // Clear patients list cache
      await this.cacheManager.del(`patients:list:${tenantSchema}`);

      return this.mapToResponse(patient);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all patients with filters and pagination
   */
  async findAll(
    tenantSchema: string,
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    cpf?: string,
    cns?: string,
  ) {
    const offset = (page - 1) * pageSize;
    let query = `SELECT id, full_name, date_of_birth, cpf, cns, gender, phone_primary, phone_secondary, email, address, health_plan_id, is_active, created_at, updated_at, created_by FROM ${tenantSchema}.patients WHERE is_active = true`;
    const params: any[] = [];

    if (search) {
      query += ` AND full_name ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }

    if (cpf) {
      query += ` AND cpf = $${params.length + 1}`;
      params.push(cpf);
    }

    if (cns) {
      query += ` AND cns = $${params.length + 1}`;
      params.push(cns);
    }

    // Get total count
    const countQuery = query.replace(/SELECT .*? FROM/, 'SELECT COUNT(*) as count FROM');
    const countResult = await this.dataSource.query(countQuery, params);
    const total = parseInt(countResult[0].count, 10);

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);

    const patients = await this.dataSource.query(query, params);

    return {
      items: patients.map((p: any) => this.mapToResponse(p)),
      total,
      page,
      pageSize,
      hasMore: offset + pageSize < total,
    };
  }

  /**
   * Find patient by ID
   */
  async findOne(id: string, tenantSchema: string): Promise<PatientResponseDto> {
    const result = await this.dataSource.query(
      `SELECT id, full_name, date_of_birth, cpf, cns, gender, phone_primary, phone_secondary,
              email, address, health_plan_id, clinical_notes, is_active, created_at, updated_at
       FROM ${tenantSchema}.patients WHERE id = $1 AND is_active = true`,
      [id],
    );

    if (!result || result.length === 0) {
      throw new NotFoundException('Patient not found');
    }

    return this.mapToResponse(result[0]);
  }

  /**
   * Update patient
   */
  async update(
    id: string,
    tenantSchema: string,
    updatePatientDto: UpdatePatientDto,
    userId: string,
  ): Promise<PatientResponseDto> {
    // Check if patient exists
    const patient = await this.findOne(id, tenantSchema);

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updatePatientDto.fullName) {
        updates.push(`full_name = $${paramCount++}`);
        values.push(updatePatientDto.fullName);
      }

      if (updatePatientDto.dateOfBirth) {
        updates.push(`date_of_birth = $${paramCount++}`);
        values.push(updatePatientDto.dateOfBirth);
      }

      if (updatePatientDto.phonePrimary) {
        updates.push(`phone_primary = $${paramCount++}`);
        values.push(updatePatientDto.phonePrimary);
      }

      if (updatePatientDto.email) {
        updates.push(`email = $${paramCount++}`);
        values.push(updatePatientDto.email);
      }

      if (updatePatientDto.address) {
        updates.push(`address = $${paramCount++}`);
        values.push(JSON.stringify(updatePatientDto.address));
      }

      if (updatePatientDto.clinicalNotes !== undefined) {
        updates.push(`clinical_notes = $${paramCount++}`);
        values.push(updatePatientDto.clinicalNotes);
      }

      updates.push(`updated_by = $${paramCount++}`);
      values.push(userId);

      updates.push(`updated_at = NOW()`);

      values.push(id);

      const result = await queryRunner.query(
        `UPDATE ${tenantSchema}.patients SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values,
      );

      this.logger.log(`Patient updated: ${id}`);

      // Clear patient cache
      await this.cacheManager.del(`patients:detail:${id}`);
      await this.cacheManager.del(`patients:list:${tenantSchema}`);

      return this.mapToResponse(result[0]);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Soft delete patient (inactivate)
   */
  async remove(id: string, tenantSchema: string, userId: string): Promise<void> {
    // Check if patient exists
    await this.findOne(id, tenantSchema);

    await this.dataSource.query(
      `UPDATE ${tenantSchema}.patients SET is_active = false, updated_by = $1, updated_at = NOW() WHERE id = $2`,
      [userId, id],
    );

    this.logger.log(`Patient inactivated: ${id}`);

    // Clear caches
    await this.cacheManager.del(`patients:detail:${id}`);
    await this.cacheManager.del(`patients:list:${tenantSchema}`);
  }

  /**
   * Map database result to DTO
   */
  private mapToResponse(patient: any): PatientResponseDto {
    const address = typeof patient.address === 'string' ? JSON.parse(patient.address) : patient.address || {};
    
    return {
      id: patient.id,
      fullName: patient.full_name,
      cpf: patient.cpf,
      cns: patient.cns,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phonePrimary: patient.phone_primary,
      phoneSecondary: patient.phone_secondary,
      email: patient.email,
      address: {
        cep: address.cep || '',
        street: address.street || '',
        number: address.number || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        complement: address.complement,
      },
      healthPlanId: patient.health_plan_id,
      isActive: patient.is_active,
      createdAt: patient.created_at,
      updatedAt: patient.updated_at,
      createdBy: patient.created_by,
    };
  }
}
