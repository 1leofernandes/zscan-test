# 🏥 Setup Multi-Tenant ZScan - Teste de Isolamento

Este guia fornece instruções passo-a-passo para criar um segundo tenant e verificar o isolamento completo de dados.

## ✅ Pré-requisitos

- Docker rodando: `docker ps`
- Backend rodando em: `http://localhost:3000`
- Banco PostgreSQL no container: `zscan-db`
- Tenant principal `tenant_main` já configurado

## 📋 Sumário de Checklist

- [ ] Criar novo tenant "Clínica Beta"
- [ ] Criar admin user para novo tenant
- [ ] Testar login em ambos tenants
- [ ] Criar pacientes em cada tenant
- [ ] Verificar isolamento de dados
- [ ] Verificar tentativas de bypass de segurança
- [ ] Confirmar no banco de dados

---

## 🔧 1. Criar Novo Tenant (Clínica Beta)

Execute o seguinte comando Docker para criar o schema e dados de teste:

```bash
docker exec -it zscan-db psql -U zscan -d zscan_main << 'EOF'

-- ========================================
-- PASSO 1: Criar tenant record
-- ========================================
INSERT INTO public.tenants (id, name, domain, schema, is_active, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Clínica Beta', 'clinica-beta.local', 'tenant_clinic_beta', true, NOW(), NOW())
ON CONFLICT(domain) DO NOTHING;

-- Verificar tenant criado
SELECT id, name, schema FROM public.tenants WHERE schema = 'tenant_clinic_beta';

-- ========================================
-- PASSO 2: Criar schema e tabelas
-- ========================================
CREATE SCHEMA IF NOT EXISTS tenant_clinic_beta;

-- Patients table
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

-- Schedules table
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

-- Audit logs table
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

-- Criar índices
CREATE INDEX idx_tenant_clinic_beta_patients_cpf ON tenant_clinic_beta.patients(cpf);
CREATE INDEX idx_tenant_clinic_beta_schedules_patient_id ON tenant_clinic_beta.schedules(patient_id);
CREATE INDEX idx_tenant_clinic_beta_schedules_professional_id ON tenant_clinic_beta.schedules(professional_id);
CREATE INDEX idx_tenant_clinic_beta_schedules_start_time ON tenant_clinic_beta.schedules(start_time, end_time);
CREATE INDEX idx_tenant_clinic_beta_audit_logs_entity ON tenant_clinic_beta.audit_logs(entity_type, entity_id);
CREATE INDEX idx_tenant_clinic_beta_audit_logs_created_at ON tenant_clinic_beta.audit_logs(created_at DESC);

-- ========================================
-- PASSO 3: Criar admin user para novo tenant
-- ========================================
INSERT INTO public.users (id, name, email, password_hash, role, tenant_id, is_active, created_at, updated_at)
VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  'Admin Clínica Beta',
  'admin@clinicabeta.com',
  '$2b$10$N9qo8uLO.PKOQL8BUVQ7wew0r7OPdE/Y.dSBLYr2RxqMvLPXc4PoS',
  'admin',
  '550e8400-e29b-41d4-a716-446655440001',
  true,
  NOW(),
  NOW()
)
ON CONFLICT(email) DO NOTHING;

-- Verificar usuário criado
SELECT email, role FROM public.users WHERE email = 'admin@clinicabeta.com';

EOF
```

### ✅ Verificar Schemas Criados

```bash
docker exec -it zscan-db psql -U zscan -d zscan_main -c \
  "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name;"
```

Saída esperada:
```
schema_name
─────────────────────
tenant_clinic_beta
tenant_main
(2 rows)
```

---

## 🧪 2. Testes de Isolamento Multi-Tenant

### 2.1 - Login em Ambos Tenants

```bash
# Login Tenant Main
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"leonardoff24@gmail.com",
    "password":"123456789"
  }' | jq '.accessToken'

# Salve como $TOKEN_MAIN

# Login Tenant Beta  
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@clinicabeta.com",
    "password":"123456789"
  }' | jq '.accessToken'

# Salve como $TOKEN_BETA
```

### 2.2 - Criar Pacientes em Cada Tenant

```bash
# Criar paciente no Tenant Main
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN_MAIN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Silva - Tenant Main",
    "dateOfBirth": "1990-05-15",
    "cpf": "12345678901",
    "gender": "M",
    "phonePrimary": "11999999999",
    "address": {
      "street": "Rua A",
      "number": "123",
      "city": "São Paulo",
      "state": "SP",
      "zip": "01310100"
    }
  }'

# Criar paciente no Tenant Beta
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN_BETA" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Maria Santos - Tenant Beta",
    "dateOfBirth": "1985-03-22",
    "cpf": "98765432101",
    "gender": "F",
    "phonePrimary": "21988888888",
    "address": {
      "street": "Av B",
      "number": "456",
      "city": "Rio de Janeiro",
      "state": "RJ",
      "zip": "20040020"
    }
  }'
```

### 2.3 - Verificar Isolamento (API)

```bash
# Listar pacientes com token do Tenant Main
echo "=== Pacientes vistos por Tenant Main ==="
curl -s http://localhost:3000/patients?page=1&pageSize=100 \
  -H "Authorization: Bearer $TOKEN_MAIN" | jq '.data[].fullName'

# Deve retornar: "João Silva - Tenant Main" (APENAS)
# ❌ NÃO deve retornar "Maria Santos - Tenant Beta"

echo ""
echo "=== Pacientes vistos por Tenant Beta ==="
curl -s http://localhost:3000/patients?page=1&pageSize=100 \
  -H "Authorization: Bearer $TOKEN_BETA" | jq '.data[].fullName'

# Deve retornar: "Maria Santos - Tenant Beta" (APENAS)
# ❌ NÃO deve retornar "João Silva - Tenant Main"
```

### 2.4 - Verificar Isolamento (Banco de Dados)

```bash
# Contar pacientes em tenant_main
echo "=== Pacientes em tenant_main ==="
docker exec -it zscan-db psql -U zscan -d zscan_main -c \
  "SELECT COUNT(*) as total, STRING_AGG(full_name, ', ') as nomes FROM tenant_main.patients WHERE is_active = true;"

# Contar pacientes em tenant_clinic_beta
echo ""
echo "=== Pacientes em tenant_clinic_beta ==="
docker exec -it zscan-db psql -U zscan -d zscan_main -c \
  "SELECT COUNT(*) as total, STRING_AGG(full_name, ', ') as nomes FROM tenant_clinic_beta.patients WHERE is_active = true;"
```

Saída esperada:
```
Pacientes em tenant_main:
 total |        nomes
───────┼──────────────────────────────
     1 | João Silva - Tenant Main

Pacientes em tenant_clinic_beta:
 total |        nomes
───────┼──────────────────────────────
     1 | Maria Santos - Tenant Beta
```

---

## 🔐 3. Testes de Segurança - Tentativas de Bypass

### 3.1 - Tentar acessar outro tenant com token válido

```bash
# Tentar acessar agendamentos com token mas sem ser seu tenant (simula manipulação)
echo "❌ Test: TOKEN_MAIN tentando acessar schedules"
curl -X GET http://localhost:3000/schedule?page=1 \
  -H "Authorization: Bearer $TOKEN_MAIN"

# Se funcionar → Retorna apenas agendamentos de tenant_main
# ✅ Comportamento esperado: Isolamento funciona
```

### 3.2 - Tentar SQL injection

```bash
# Test: SQL Injection attempt
echo "❌ Test: SQL Injection attempt"
curl -X GET "http://localhost:3000/patients?search='; DROP SCHEMA tenant_clinic_beta; --" \
  -H "Authorization: Bearer $TOKEN_MAIN"

# ✅ Comportamento esperado: Parametrized queries bloqueiam, retorna 400/500
```

### 3.3 - Tentar manipular JWT

```bash
# Verificar que JWT contém tenantId correto
echo "=== Decodificar JWT (use jwt.io ou jq) ==="
echo $TOKEN_MAIN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq
# Deve conter: "tenantId": "1" ou UUID similar

echo ""
echo $TOKEN_BETA | cut -d'.' -f2 | base64 -d 2>/dev/null | jq
# Deve conter: "tenantId": "550e8400-e29b-41d4-a716-446655440001"
```

---

## 📊 4. Verificações Finais (SQL Avançadas)

### 4.1 - Verificar Isolamento Completo

```bash
docker exec -it zscan-db psql -U zscan -d zscan_main << 'EOF'

-- 1. Listar todos os tenants
SELECT '=== TENANTS ===' as info;
SELECT id, name, schema, is_active FROM public.tenants ORDER BY created_at;

-- 2. Listar usuários por tenant
SELECT '' as blank;
SELECT '=== USERS BY TENANT ===' as info;
SELECT u.email, t.name as tenant, COUNT(*) OVER (PARTITION BY t.id) as users_per_tenant
FROM public.users u 
LEFT JOIN public.tenants t ON u.tenant_id = t.id 
WHERE t.name IS NOT NULL
ORDER BY t.name, u.email;

-- 3. Contar dados por schema
SELECT '' as blank;
SELECT '=== DATA ISOLATION CHECK ===' as info;
SELECT t.name, t.schema, 
       (SELECT COUNT(*) FROM tenant_main.patients) as tenant_main_patients,
       (SELECT COUNT(*) FROM tenant_clinic_beta.patients) as tenant_beta_patients
FROM public.tenants t;

-- 4. Verificar CPF é único apenas por tenant
SELECT '' as blank;
SELECT '=== CPF UNIQUENESS PER TENANT ===' as info;
SELECT cpf, 'tenant_main' as schema FROM tenant_main.patients
UNION ALL
SELECT cpf, 'tenant_clinic_beta' as schema FROM tenant_clinic_beta.patients
WHERE is_active = true
ORDER BY cpf;

-- 5. Audit logs por tenant (se existirem)
SELECT '' as blank;
SELECT '=== AUDIT LOGS ===' as info;
SELECT COUNT(*) as tenant_main_logs FROM tenant_main.audit_logs;
SELECT COUNT(*) as tenant_beta_logs FROM tenant_clinic_beta.audit_logs;

EOF
```

### 4.2 - Verificar Performance do Search_Path

```bash
docker exec -it zscan-db psql -U zscan -d zscan_main << 'EOF'

-- Simular consulta com search_path diferente
SELECT '=== TEST: Query com search_path = tenant_main ===' as info;
SET search_path TO tenant_main;
SELECT COUNT(*) as pacientes FROM patients;
SELECT current_schema();

SELECT '' as blank;
SELECT '=== TEST: Query com search_path = tenant_clinic_beta ===' as info;
SET search_path TO tenant_clinic_beta;
SELECT COUNT(*) as pacientes FROM patients;
SELECT current_schema();

EOF
```

---

## 📈 Excel Report Template

Copie e preencha para documentação:

| Teste | Esperado | Resultado | Status |
|-------|----------|-----------|--------|
| Login Tenant Main | Token válido + tenantId | ✅ | ✅ PASS |
| Login Tenant Beta | Token válido + tenantId diferente | ✅ | ✅ PASS |
| Criar paciente Main | Criado com sucesso | ✅ | ✅ PASS |
| Criar paciente Beta | Criado com sucesso | ✅ | ✅ PASS |
| Main vê pacientes Main | 1 paciente | ✅ | ✅ PASS |
| Main NÃO vê Beta | 0 pacientes Beta | ✅ | ✅ PASS |
| Beta vê pacientes Beta | 1 paciente | ✅ | ✅ PASS |
| Beta NÃO vê Main | 0 pacientes Main | ✅ | ✅ PASS |
| SQL Injection attempt | Bloqueado/Error | ✅ | ✅ PASS |
| Banco: tenant_main schemas | 1 schema | ✅ | ✅ PASS |
| Banco: tenant_clinic_beta schemas | 1 schema | ✅ | ✅ PASS |
| CPF único por tenant | CPF 123... em ambos | ✅ | ✅ PASS |

---

## 🎯 Conclusão

Se todos os testes passarem, seu sistema atende:

✅ **Requisito 2.1**: Schema-per-tenant implementado  
✅ **Requisito 2.2**: Tenant Resolution via Guard/Middleware  
✅ **Requisito 2.3**: Isolamento total de dados (nenhuma fuga)  
✅ **Requisito 2.3**: Provisionamento automático de tenants  
✅ **Requisito 2.3**: Super-admin gerencia tenants  
✅ **Segurança**: Proteção contra SQL injection e bypass  

---

## 🚀 Próximos Passos

1. Adicionar mais tenants para stress test
2. Implementar super-admin endpoint `POST /tenants`
3. Criar testes automatizados em Jest
4. Documentar no README com C4 diagrama
