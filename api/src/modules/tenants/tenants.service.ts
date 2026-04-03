import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateTenantDto, UpdateTenantDto, TenantResponseDto } from './tenants.dto';
import { UserRole } from '../../common/interfaces/context.interface';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Create and provision a new tenant (super-admin only)
   */
  async create(createTenantDto: CreateTenantDto, userId: string): Promise<any> {
    const { name, domain, adminEmail, adminName, adminPassword } = createTenantDto;

    // Generate schema name if not provided
    const schema = createTenantDto.schema || this.generateSchemaName(domain);

    // Check if domain already exists
    const existingDomain = await this.dataSource.query(
      `SELECT id FROM public.tenants WHERE domain = $1 OR schema = $2 LIMIT 1`,
      [domain, schema],
    );

    if (existingDomain && existingDomain.length > 0) {
      throw new ConflictException('Domain or schema already exists');
    }

    // Check if admin email already exists
    const existingEmail = await this.dataSource.query(
      `SELECT id FROM public.users WHERE email = $1 LIMIT 1`,
      [adminEmail],
    );

    if (existingEmail && existingEmail.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Step 1: Create tenant record
      const tenantResult = await queryRunner.query(
        `INSERT INTO public.tenants (name, domain, schema, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, true, $4, NOW(), NOW())
         RETURNING id, name, domain, schema, is_active, created_at, updated_at`,
        [name, domain, schema, userId],
      );

      const tenant = tenantResult[0];
      this.logger.log(`Tenant created: ${tenant.id} - Name: ${name}`);

      // Step 2: Create schema
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      this.logger.log(`Schema created: ${schema}`);

      // Step 3: Create tables in tenant schema
      await this.createTenantSchema(queryRunner, schema);

      // Step 4: Create admin user for tenant
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const userResult = await queryRunner.query(
        `INSERT INTO public.users (name, email, password_hash, role, tenant_id, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, $6, NOW(), NOW())
         RETURNING id, email, name, role`,
        [adminName, adminEmail, hashedPassword, UserRole.ADMIN, tenant.id, userId],
      );

      const adminUser = userResult[0];
      this.logger.log(`Admin user created for tenant: ${adminUser.email}`);

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        schema: schema,
        message: 'Tenant provisioned successfully',
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to provision tenant: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all tenants (super-admin only)
   */
  async findAll(page: number = 1, pageSize: number = 20): Promise<any> {
    const offset = (page - 1) * pageSize;

    const countResult = await this.dataSource.query(`SELECT COUNT(*) as count FROM public.tenants`);
    const total = parseInt(countResult[0].count, 10);

    const tenants = await this.dataSource.query(
      `SELECT id, name, domain, schema, is_active, created_at, updated_at
       FROM public.tenants
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    );

    return {
      items: tenants.map((t: any) => this.mapToResponse(t)),
      total,
      page,
      pageSize,
      hasMore: offset + pageSize < total,
    };
  }

  /**
   * Find tenant by ID
   */
  async findOne(id: string): Promise<TenantResponseDto> {
    const result = await this.dataSource.query(
      `SELECT id, name, domain, schema, is_active, created_at, updated_at
       FROM public.tenants
       WHERE id = $1`,
      [id],
    );

    if (!result || result.length === 0) {
      throw new NotFoundException('Tenant not found');
    }

    return this.mapToResponse(result[0]);
  }

  /**
   * Update tenant settings
   */
  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<TenantResponseDto> {
    // Verify tenant exists
    await this.findOne(id);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateTenantDto.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateTenantDto.name);
    }

    if (updateTenantDto.description) {
      updates.push(`description = $${paramCount++}`);
      values.push(updateTenantDto.description);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.dataSource.query(
      `UPDATE public.tenants SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, domain, schema, is_active, created_at, updated_at`,
      values,
    );

    return this.mapToResponse(result[0]);
  }

  /**
   * Deactivate tenant
   */
  async deactivate(id: string): Promise<void> {
    // Verify tenant exists
    await this.findOne(id);

    await this.dataSource.query(
      `UPDATE public.tenants SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id],
    );

    this.logger.log(`Tenant deactivated: ${id}`);
  }

  /**
   * Get tenant usage stats
   */
  async getStats(id: string): Promise<any> {
    const tenant = await this.findOne(id);

    const schema = tenant.schema;

    const patientsCount = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ${schema}.patients WHERE is_active = true`,
    );

    const schedulesCount = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ${schema}.schedules`,
    );

    const usersCount = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM public.users WHERE tenant_id = $1 AND is_active = true`,
      [id],
    );

    return {
      tenantId: id,
      tenantName: tenant.name,
      patients: parseInt(patientsCount[0].count),
      schedules: parseInt(schedulesCount[0].count),
      users: parseInt(usersCount[0].count),
    };
  }

  /**
   * Private helper methods
   */

  private async createTenantSchema(queryRunner: any, schema: string): Promise<void> {
    // Create patients table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS ${schema}.patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        cpf VARCHAR(11) UNIQUE NOT NULL,
        cns VARCHAR(15),
        gender CHAR(1) NOT NULL,
        phone_primary VARCHAR(20) NOT NULL,
        phone_secondary VARCHAR(20),
        email VARCHAR(100),
        address JSONB NOT NULL,
        health_plan_id UUID,
        clinical_notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
    );

    // Create schedule table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS ${schema}.schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES ${schema}.patients(id),
        professional_id UUID NOT NULL,
        professional_name VARCHAR(100) NOT NULL,
        resource_room VARCHAR(50),
        procedure_type VARCHAR(50) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        origin VARCHAR(50) DEFAULT 'in_person',
        notes TEXT,
        patient_instructions TEXT,
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
    );

    // Create audit_logs table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS ${schema}.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        user_id UUID,
        user_email VARCHAR(100),
        old_values JSONB,
        new_values JSONB,
        description TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    );

    // Create indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_${schema}_patients_cpf ON ${schema}.patients(cpf)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_${schema}_patients_active ON ${schema}.patients(is_active)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_${schema}_schedules_patient ON ${schema}.schedules(patient_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_${schema}_schedules_prof ON ${schema}.schedules(professional_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_${schema}_schedules_time ON ${schema}.schedules(start_time, end_time)`);

    this.logger.log(`Tenant schema tables created: ${schema}`);
  }

  private generateSchemaName(domain: string): string {
    return `tenant_${domain.replace(/-/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;
  }

  private mapToResponse(tenant: any): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      schema: tenant.schema,
      isActive: tenant.is_active,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    };
  }
}
