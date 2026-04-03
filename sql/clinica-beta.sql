# Conecte ao banco e crie o novo tenant + schema
docker exec -it zscan-db psql -U zscan -d zscan_main << EOF

-- 1. Cria tenant record
INSERT INTO public.tenants (id, name, domain, schema, is_active, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Clínica Beta', 'clinica-beta.local', 'tenant_clinic_beta', true, NOW(), NOW())
ON CONFLICT(domain) DO NOTHING;

-- 2. Cria schema e tabelas
CREATE SCHEMA IF NOT EXISTS tenant_clinic_beta;

-- Cria tabelas no novo schema (copiado de CreateTenantSchema migration)
CREATE TABLE IF NOT EXISTS tenant_clinic_beta.patients (
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
);

CREATE TABLE IF NOT EXISTS tenant_clinic_beta.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES tenant_clinic_beta.patients(id) ON DELETE RESTRICT,
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
);

CREATE TABLE IF NOT EXISTS tenant_clinic_beta.audit_logs (
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
);

-- Cria índices
CREATE INDEX idx_tenant_clinic_beta_patients_cpf ON tenant_clinic_beta.patients(cpf);
CREATE INDEX idx_tenant_clinic_beta_schedules_patient_id ON tenant_clinic_beta.schedules(patient_id);
CREATE INDEX idx_tenant_clinic_beta_schedules_professional_id ON tenant_clinic_beta.schedules(professional_id);
CREATE INDEX idx_tenant_clinic_beta_schedules_start_time ON tenant_clinic_beta.schedules(start_time, end_time);
CREATE INDEX idx_tenant_clinic_beta_audit_logs_entity ON tenant_clinic_beta.audit_logs(entity_type, entity_id);
CREATE INDEX idx_tenant_clinic_beta_audit_logs_created_at ON tenant_clinic_beta.audit_logs(created_at DESC);

-- 3. Cria usuário admin para o novo tenant
INSERT INTO public.users (id, name, email, password_hash, role, tenant_id, is_active, created_at, updated_at)
VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  'Admin Clínica Beta',
  'admin@clinicabeta.com',
  '$2b$10$N9qo8uLO.PKOQL8BUVQ7wew0r7OPdE/Y.dSBLYr2RxqMvLPXc4PoS', -- password: "123456789"
  'admin',
  '550e8400-e29b-41d4-a716-446655440001',
  true,
  NOW(),
  NOW()
)
ON CONFLICT(email) DO NOTHING;

EOF

# Verify schemas were created
docker exec -it zscan-db psql -U zscan -d zscan_main -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name;"