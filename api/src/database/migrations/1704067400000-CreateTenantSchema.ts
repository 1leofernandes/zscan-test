import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * This migration is used as a template to create schemas for new tenants
 * It should be executed for each new tenant schema created
 */
export class CreateTenantSchema1704067400000 implements MigrationInterface {
  private tenantSchema = 'tenant_template';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS ${this.tenantSchema}`);

    // Create patients table
    await queryRunner.query(
      `
      CREATE TABLE IF NOT EXISTS ${this.tenantSchema}.patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        cpf VARCHAR(11) NOT NULL UNIQUE,
        cns VARCHAR(15) UNIQUE,
        gender CHAR(1) DEFAULT 'M' CHECK (gender IN ('M', 'F', 'O')),
        phone_primary VARCHAR(20) NOT NULL,
        phone_secondary VARCHAR(20),
        email VARCHAR(100),
        address JSONB NOT NULL,
        health_plan_id UUID,
        clinical_notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP,
        created_by UUID,
        updated_by UUID
      )
      `,
    );

    // Create schedules table
    await queryRunner.query(
      `
      CREATE TABLE IF NOT EXISTS ${this.tenantSchema}.schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES ${this.tenantSchema}.patients(id) ON DELETE RESTRICT,
        professional_id UUID NOT NULL,
        professional_name VARCHAR(50) NOT NULL,
        resource_room VARCHAR(50),
        procedure_type VARCHAR(50) DEFAULT 'consultation' CHECK (procedure_type IN ('consultation', 'checkup', 'imaging', 'exam', 'follow_up', 'surgery')),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_attendance', 'completed', 'cancelled', 'no_show')),
        origin VARCHAR(50) DEFAULT 'in_person' CHECK (origin IN ('in_person', 'phone', 'online')),
        patient_notes TEXT,
        clinical_notes TEXT,
        is_confirmed BOOLEAN DEFAULT false,
        confirmed_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP,
        created_by UUID,
        updated_by UUID
      )
      `,
    );

    // Create audit_logs table
    await queryRunner.query(
      `
      CREATE TABLE IF NOT EXISTS ${this.tenantSchema}.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore', 'login', 'status_change')),
        user_id UUID,
        user_email VARCHAR(255),
        old_values JSONB,
        new_values JSONB,
        description TEXT,
        ip_address VARCHAR(50),
        metadata JSONB,
        is_sensitive BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
      `,
    );

    // Create indices for tenant schema
    await queryRunner.query(
      `CREATE INDEX idx_${this.tenantSchema}_patients_cpf ON ${this.tenantSchema}.patients(cpf)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_${this.tenantSchema}_schedules_patient_id ON ${this.tenantSchema}.schedules(patient_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_${this.tenantSchema}_schedules_professional_id ON ${this.tenantSchema}.schedules(professional_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_${this.tenantSchema}_schedules_start_time ON ${this.tenantSchema}.schedules(start_time, end_time)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_${this.tenantSchema}_audit_logs_entity ON ${this.tenantSchema}.audit_logs(entity_type, entity_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_${this.tenantSchema}_audit_logs_created_at ON ${this.tenantSchema}.audit_logs(created_at DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS ${this.tenantSchema} CASCADE`);
  }
}
