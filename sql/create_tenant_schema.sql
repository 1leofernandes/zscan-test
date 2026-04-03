CREATE SCHEMA IF NOT EXISTS tenant_main;

-- Criar ENUMs
CREATE TYPE tenant_main.schedule_status_enum AS ENUM ('scheduled', 'confirmed', 'in_attendance', 'completed', 'cancelled', 'no_show');
CREATE TYPE tenant_main.procedure_type_enum AS ENUM ('consultation', 'checkup', 'imaging', 'exam', 'follow_up', 'surgery');
CREATE TYPE tenant_main.schedule_origin_enum AS ENUM ('in_person', 'phone', 'online');
CREATE TYPE tenant_main.patient_gender_enum AS ENUM ('M', 'F', 'O');
CREATE TYPE tenant_main.users_role_enum AS ENUM ('super_admin', 'admin', 'professional', 'receptionist', 'user');

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS tenant_main.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    role tenant_main.users_role_enum DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    tenant_id UUID,
    phone VARCHAR,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Tabela de pacientes
CREATE TABLE IF NOT EXISTS tenant_main.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    cns VARCHAR(15),
    gender tenant_main.patient_gender_enum DEFAULT 'M',
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(100),
    address JSONB NOT NULL,
    insurance_id VARCHAR,
    health_plan_id VARCHAR,
    clinical_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS tenant_main.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES tenant_main.patients(id),
    professional_id UUID NOT NULL,
    professional_name VARCHAR(50),
    resource_room VARCHAR(50),
    procedure_type tenant_main.procedure_type_enum DEFAULT 'consultation',
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    status tenant_main.schedule_status_enum DEFAULT 'scheduled',
    origin tenant_main.schedule_origin_enum DEFAULT 'in_person',
    notes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices em schedules
CREATE INDEX IF NOT EXISTS idx_schedules_patient_id ON tenant_main.schedules(patient_id);
CREATE INDEX IF NOT EXISTS idx_schedules_professional_id ON tenant_main.schedules(professional_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON tenant_main.schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_end_time ON tenant_main.schedules(end_time);

-- Tabela de audit logs
CREATE TABLE IF NOT EXISTS tenant_main.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificar que tudo foi criado
SELECT 'Tabelas criadas com sucesso no schema tenant_main' as status;

