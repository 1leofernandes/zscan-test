import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUnavailabilityTable1704070000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all tenant schemas from tenant table
    const tenants = await queryRunner.query(`
      SELECT schema FROM public.tenants WHERE is_active = true
    `);

    // Create table in each tenant schema
    for (const tenant of tenants) {
      const schema = tenant.schema;
      
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.unavailabilities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          professional_id UUID NOT NULL,
          professional_name VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'other',
          title TEXT,
          description TEXT,
          start_time TIMESTAMP,
          end_time TIMESTAMP,
          is_all_day BOOLEAN NOT NULL DEFAULT TRUE,
          resource_room VARCHAR(100),
          recurring BOOLEAN NOT NULL DEFAULT FALSE,
          recurrence_pattern VARCHAR(50),
          created_by UUID,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMP
        );
      `);

      // Create indexes
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_unavailability_professional_${schema} ON ${schema}.unavailabilities(professional_id)`
      );
      
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_unavailability_times_${schema} ON ${schema}.unavailabilities(start_time, end_time)`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get all tenant schemas
    const tenants = await queryRunner.query(`
      SELECT schema FROM public.tenants
    `);

    // Drop table from each tenant schema
    for (const tenant of tenants) {
      const schema = tenant.schema;
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.unavailabilities`);
    }
  }
}
