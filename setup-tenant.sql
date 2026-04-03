cat > D:/zscan/setup-tenant.sql << 'EOF'
-- ============================================
-- Setup completo do schema tenant_main
-- ============================================

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS tenant_main;

-- ============================================
-- 1. Tabela: patients
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_main.patients (
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

-- ============================================
-- 2. Tabela: schedules
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_main.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  professional_name VARCHAR(50) NOT NULL,
  resource_room VARCHAR(50),
  procedure_type VARCHAR(50) DEFAULT 'consultation',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  origin VARCHAR(50) DEFAULT 'in_person',
  notes TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- ============================================
-- 3. Tabela: unavailabilities
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_main.unavailabilities (
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

-- ============================================
-- 4. Tabela: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_main.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
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

-- ============================================
-- Índices
-- ============================================

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON tenant_main.patients(cpf);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON tenant_main.patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_cns ON tenant_main.patients(cns);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_schedules_patient_id ON tenant_main.schedules(patient_id);
CREATE INDEX IF NOT EXISTS idx_schedules_professional_id ON tenant_main.schedules(professional_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON tenant_main.schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_end_time ON tenant_main.schedules(end_time);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON tenant_main.schedules(status);

-- Unavailabilities indexes
CREATE INDEX IF NOT EXISTS idx_unavailability_professional_id ON tenant_main.unavailabilities(professional_id);
CREATE INDEX IF NOT EXISTS idx_unavailability_times ON tenant_main.unavailabilities(start_time, end_time);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON tenant_main.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON tenant_main.audit_logs(created_at DESC);

-- ============================================
-- Verificar criação
-- ============================================
SELECT '✅ Schema tenant_main criado com sucesso!' as status;
SELECT COUNT(*) as total_tabelas FROM information_schema.tables WHERE table_schema = 'tenant_main';

EOF