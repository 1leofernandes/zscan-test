import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializePublicSchema1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenants table
    await queryRunner.query(
      `
      CREATE TABLE public.tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        schema VARCHAR(50) NOT NULL UNIQUE,
        domain VARCHAR(100) UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by UUID,
        updated_by UUID,
        CONSTRAINT schema_name_valid CHECK (schema ~ '^[a-z0-9_]+$' AND schema NOT IN ('public', 'information_schema', 'pg_catalog'))
      )
      `,
    );

    // Create users table
    await queryRunner.query(
      `
      CREATE TABLE public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('super-admin', 'admin', 'user', 'clinician', 'receptionist')),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        phone VARCHAR(20),
        permissions JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by UUID,
        updated_by UUID,
        CONSTRAINT email_tenant_unique UNIQUE (email, tenant_id)
      )
      `,
    );

    // Create indices
    await queryRunner.query(
      `CREATE INDEX idx_users_email ON public.users(email)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_users_tenant_id ON public.users(tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tenants_domain ON public.tenants(domain)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tenants_domain`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_tenant_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.users`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.tenants`);
  }
}
