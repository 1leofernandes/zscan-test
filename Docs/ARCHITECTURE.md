Aqui está o seu README.md traduzido para o português, mantendo o mesmo formato e estrutura:

```markdown
# 🏥 ZScan Health - Sistema de Gestão de Saúde Multi-Tenant Empresarial

![Status](https://img.shields.io/badge/status-production--ready-brightgreen) ![Build](https://img.shields.io/badge/build-passing-brightgreen) ![TypeScript](https://img.shields.io/badge/language-TypeScript-blue) ![License](https://img.shields.io/badge/license-MIT-blue)

**ZScan** é um sistema moderno de gestão de saúde multi-tenant de nível empresarial, projetado para clínicas, centros de saúde e instalações médicas. Oferece gerenciamento completo de pacientes, agendamento inteligente de consultas com detecção de conflitos em tempo real, reagendamento por arrastar e soltar, e conformidade com LGPD através de isolamento de dados por esquema por tenant.

**Recursos Prontos para Produção:**
- ✅ **Multi-Tenancy** - Isolamento completo de esquema por tenant (conforme LGPD)
- ✅ **Agendamento Inteligente** - Detecção de conflitos, cálculo de disponibilidade, reagendamento drag & drop
- ✅ **Gestão de Pacientes** - CRUD completo com exclusão suave e trilhas de auditoria abrangentes
- ✅ **Agenda em Tempo Real** - Visualizações de calendário Dia/Semana/Mês com atualizações ao vivo
- ✅ **Indisponibilidade de Profissionais** - Gestão de férias/atestados
- ✅ **Cache com Redis** - Otimização de desempenho de nível empresarial
- ✅ **Autenticação JWT** - Estratégia de refresh token com acesso baseado em função
- ✅ **Registro de Auditoria** - Trilha completa para requisitos regulatórios
- ✅ **Pronto para Docker** - Implantação com um comando e orquestração completa

---

## 📑 Índice

1. [Início Rápido](#-início-rápido)
2. [Arquitetura e Decisões](#-arquitetura--decisões)
3. [Instalação e Configuração](#-instalação--configuração)
4. [Configuração](#-configuração)
5. [Documentação da API](#-documentação-da-api)
6. [Esquema do Banco de Dados](#-esquema-do-banco-de-dados)
7. [Visão Geral dos Recursos](#-visão-geral-dos-recursos)
8. [Reagendamento por Drag & Drop](#-reagendamento-por-drag--drop-novo)
9. [Estrutura do Projeto](#-estrutura-do-projeto)
10. [Stack Técnico](#-stack-técnico)
11. [Limitações e Trabalhos Futuros](#-limitações--trabalhos-futuros)
12. [Solução de Problemas](#-solução-de-problemas)

---

## 🚀 Início Rápido

### Pré-requisitos
- **Docker e Docker Compose** (recomendado, inclui todas as dependências)
- **Node.js 18+** e **npm 9+** (se executar localmente sem Docker)
- **PostgreSQL 15+** (se não usar Docker)
- **Redis 7+** (opcional, mas altamente recomendado)

### Iniciar Tudo com Docker (Recomendado - 30 segundos)

**Windows (PowerShell):**
```powershell
# Clonar repositório
git clone <repo> zscan && cd zscan

# Copiar arquivos de ambiente
cp .env.example .env
cp api\.env.example api\.env

# Iniciar todos os serviços com um comando
.\docker-start.ps1

# Serviços prontos em 30-60 segundos em:
# 🌐 Frontend:  http://localhost:3001
# 🔌 API:       http://localhost:3000
# 📚 Swagger:   http://localhost:3000/api/docs
```

**macOS / Linux (Bash):**
```bash
git clone <repo> zscan && cd zscan

chmod +x docker-start.sh
./docker-start.sh

# Mesmos serviços nos mesmos endpoints
```

### Credenciais de Teste

docker exec -it zscan-db psql -U zscan -d zscan_main -c "
INSERT INTO public.users (id, name, email, password_hash, role, is_active, created_at, updated_at, tenant_id)
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@zscan.com',
  'admin123456',
  'super_admin',
  true,
  NOW(),
  NOW(),
  'de5564d3-d335-4e19-9d3c-2439bdd21d54'
);
"

```
Email:    admin@zscan.com
Senha:    admin123456
Tenant:   Padrão (criado automaticamente)
```

### Verificar Instalação
```bash
# Verificar containers em execução
docker ps

# Testar saúde da API
curl http://localhost:3000/health
# Saída: {"status":"ok"}

# Visualizar logs
docker logs zscan-api -f
docker logs zscan-db -f
```

---

## 🏗️ Arquitetura e Decisões

### 1. Estratégia de Multi-Tenancy: **Schema-por-Tenant**

#### Por que esta Abordagem?

| Aspecto | Schema-por-Tenant | Segurança por Linha | Banco Separado |
|---------|-------------------|---------------------|----------------|
| **Isolamento de Dados** | Nível de banco (mais seguro) | Nível de aplicação (arriscado) | Isolamento máximo |
| **Desempenho** | Índices dedicados por schema | Índices únicos | Hardware dedicado |
| **Conformidade LGPD** | Trilha de auditoria clara | Políticas complexas | Mais fácil de auditar |
| **Escalabilidade** | Escalonamento horizontal fácil | Sharding complexo | Isolamento perfeito |
| **Backup/Restauração** | Backups por schema | Apenas BD completo | Backups por BD |
| **Custo Operacional** | Moderado | Eficiente | Mais alto |

**Implementação:**
```
Banco de Dados PostgreSQL: `zscan_main`
├── schema public (compartilhado)
│   ├── users (todos os usuários de todas as clínicas)
│   ├── tenants (lista de clínicas)
│   └── tenant_schemas (mapeamento)
│
├── schema tenant_550e8400 (Clínica 1 - isolamento completo)
│   ├── patients
│   ├── schedules
│   ├── professionals
│   ├── unavailabilities
│   ├── audit_logs
│   └── (todos com índices)
│
└── schema tenant_550e8401 (Clínica 2 - outra clínica)
    ├── patients
    ├── schedules
    └── ...
```

**Fluxo do Middleware:**
```
Requisição HTTP (com JWT)
    ↓
TenantMiddleware extrai tenant_id do JWT
    ↓
DataSource muda para o schema tenant_{id}
    ↓
Serviço consulta APENAS o schema tenant_{id}
    ↓
Isolamento completo de dados garantido no nível do banco
```

---

### 2. Escolha do ORM: **TypeORM**

**Por que TypeORM em vez de Prisma ou SQL puro?**

```typescript
// Consultas type-safe com autocompletar completo da IDE
const schedule = await scheduleRepository.findOne({
  where: { id: scheduleId, status: 'confirmed' },
  relations: ['patient', 'professional'],
  order: { startTime: 'ASC' },
});

// Migrations sem atrito - migrações são cidadãos de primeira classe
// Construtor de queries previne SQL injection automaticamente
// Padrão Repository = código limpo e testável
```

**Benefícios:**
- ✅ **Integração nativa com NestJS** - Funciona perfeitamente com injeção de dependência
- ✅ **Consultas type-safe** - Captura erros em tempo de compilação, não em execução
- ✅ **Sistema de migrações** - Mudanças de esquema versionadas e amigáveis ao Git
- ✅ **Construtor de queries** - Consultas complexas sem SQL puro
- ✅ **Relacionamentos** - Carregamento eager/lazy fácil, operações em cascata
- ✅ **Suporte multi-schema** - Perfeito para gestão de schemas de tenant

**Trade-offs:**
- ⚠️ Um pouco mais lento que SQL puro (5-15% de overhead, insignificante para esta escala)
- ⚠️ Tamanho de bundle maior (aceita o trade-off pela manutenibilidade)

---

### 3. Estratégia de Cache: **Redis**

#### Camadas de Cache

| Camada de Cache | TTL | Taxa de Acerto | Propósito |
|----------------|-----|----------------|-----------|
| **Disponibilidade de Agenda** | 15 min | 80%+ | Slots de horário disponíveis para profissional |
| **Pacientes Frequentes** | 1 hora | 60%+ | Top 100 pacientes por clínica |
| **Permissões de Usuário** | 30 min | 70%+ | Controle de acesso baseado em função |
| **Visualização de Agenda** | 5 min | 75%+ | Agenda completa do dia/semana |

**Implementação:**
```typescript
async getAvailability(professionalId, date) {
  const cacheKey = `availability:${professionalId}:${date}`;
  
  // Tentar cache primeiro
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Calcular a partir do banco de dados
  const slots = await this.calculateSlots(professionalId, date);
  
  // Armazenar em cache por 15 minutos
  await redis.set(cacheKey, JSON.stringify(slots), 'EX', 900);
  
  return slots;
}

// Ao criar agendamento: invalidar caches relacionados
async createSchedule(data) {
  const schedule = await scheduleRepo.save(data);
  
  // Limpar caches que dependem deste agendamento
  await redis.del(`availability:${data.professionalId}:${formatDate(data.startTime)}`);
  await redis.del(`agenda:day:${formatDate(data.startTime)}`);
  
  return schedule;
}
```

---

### 4. Autenticação: **JWT com Refresh Tokens**

#### Arquitetura de Segurança

```
LOGIN DO USUÁRIO
    ↓
POST /auth/login {email, password}
    ↓
[Hash da Senha] → Comparação com Bcrypt
    ↓
Gerar Tokens:
  • accessToken (expira em 15 min) → Memória
  • refreshToken (7 dias) → Cookie httpOnly Secure
    ↓
Retornar ao cliente → Frontend armazena accessToken na memória

REQUISIÇÕES AUTENTICADAS
    ↓
Incluir: Authorization: Bearer {accessToken}
    ↓
JwtAuthGuard valida assinatura e expiração
    ↓
AccessToken expirado?
    ├─ SIM: POST /auth/refresh (envia refreshToken via cookie)
    │   ↓
    │   Gerar novo accessToken → Retornar no corpo da resposta
    │   
    └─ NÃO: Requisição prossegue
    ↓
TenantMiddleware resolve tenant do payload do JWT
    ↓
Executar no schema do tenant
```

**Payload do JWT:**
```json
{
  "id": "user-uuid",
  "email": "doctor@clinic.com",
  "tenantId": "tenant-uuid",
  "role": "doctor|admin|receptionist",
  "iat": 1680000000,
  "exp": 1680900000
}
```

---

### 5. Reagendamento por Drag & Drop (Recém Corrigido ✅)

#### Problema Resolvido
Anteriormente, o drag & drop tinha **problemas de fuso horário** - arrastar para as 8:00 reagendava para as 11:00 (diferença de 3 horas).

#### Solução
```typescript
// Frontend: Converter para datetime local "ingênuo" (sem sufixo Z)
function toLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Retorna: "2026-04-03T08:00:00.000" (sem Z, significa horário local)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000`;
}

// Backend: Interpreta como timestamp equivalente a UTC (preserva o horário local original)
const newStart = new Date('2026-04-03T08:00:00.000');
// Armazenado corretamente: representa 8:00 AM no fuso horário do usuário
```

#### Melhorias na UI/UX
- ✅ Slots mostram **horários fixos** (8:00, 9:00, 10:00) - não sincronizados com o horário atual
- ✅ Logging detalhado no console para depuração
- ✅ Mensagens de erro visuais quando o reagendamento falha
- ✅ Detecção de conflitos em tempo real

---

## 📦 Instalação e Configuração

### Docker (Recomendado - 30 segundos)

```bash
# 1. Clonar repositório
git clone <repo> zscan && cd zscan

# 2. Copiar arquivos de ambiente
cp .env.example .env
cp api/.env.example api/.env

# 3. Iniciar serviços
docker-compose up -d

# 4. Verificar containers em execução
docker ps

# 5. Inicializar banco de dados (já feito na inicialização do container)
# Mas se necessário manualmente:
docker exec zscan-api npm run typeorm migration:run

# 6. Verificar serviços
curl http://localhost:3000/health           # ✅ API em execução
curl http://localhost:3001                  # ✅ Frontend em execução

# Acessar serviços:
# Frontend: http://localhost:3001
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
# Logs: docker logs -f zscan-api
```

### Desenvolvimento Local (Node + Banco Docker)

```bash
# 1. Clonar e configurar
git clone <repo> zscan && cd zscan

# 2. Iniciar apenas serviços de banco de dados
docker-compose up -d db redis

# 3. Instalar dependências
cd api && npm install && cd ../web && npm install && cd ..

# 4. Configurar ambiente (editar para apontar para localhost)
cp api/.env.example api/.env
# Editar api/.env: DB_HOST=localhost (não "db")

# 5. Executar migrações
cd api && npm run typeorm migration:run

# 6. Iniciar serviços em terminais separados
# Terminal 1 - API
cd api && npm run start:dev

# Terminal 2 - Frontend
cd web && npm run dev

# Acessar em:
# Frontend: http://localhost:3001
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

### Totalmente Local ( PostgreSQL + Redis)

```bash
# Pré-requisitos: PostgreSQL 15+, Node 18+, Redis 7+

# 1. Criar banco de dados
createdb zscan_main -O zscan

# 2. Instalar dependências
cd api && npm install && cd ../web && npm install && cd ..

# 3. Criar arquivos .env
cp api/.env.example api/.env
# Configurar api/.env com seus detalhes do PostgreSQL local

# 4. Executar migrações
cd api && npm run typeorm migration:run

# 5. Iniciar serviços (terminais separados)
# Terminal 1 - API
npm run start:dev

# Terminal 2 - Frontend
cd ../web && npm run dev
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

#### `.env` Raiz

```env
# Serviços Docker
COMPOSE_PROJECT_NAME=zscan

# Banco de Dados
DB_USER=zscan
DB_PASSWORD=zscan123              # ⚠️ ALTERAR EM PRODUÇÃO!
DB_NAME=zscan_main
DB_PORT=5432

# Autenticação JWT
JWT_SECRET=sua-chave-secreta-min-32-caracteres-altere   # ⚠️ ALTERAR!
JWT_REFRESH_SECRET=sua-chave-refresh-min-32-caracteres  # ⚠️ ALTERAR!

# NextAuth (Frontend)
NEXTAUTH_SECRET=seu-segredo-nextauth-min-32-caracteres  # ⚠️ ALTERAR!
NEXTAUTH_URL=http://localhost:3001

# Redis (Opcional)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=                                         # Deixar vazio se sem senha

# Configuração da API
API_PORT=3000
API_URL=http://localhost:3000

# Configuração do Frontend
FRONTEND_PORT=3001
FRONTEND_URL=http://localhost:3001

# Ambiente
NODE_ENV=development               # production em produção
LOG_LEVEL=debug                    # warn em produção
```

#### API `.env` (api/.env)

```env
# Conexão com Banco de Dados
DB_HOST=db                         # "db" para Docker; "localhost" para desenvolvimento local
DB_PORT=5432
DB_USER=zscan
DB_PASSWORD=zscan123
DB_NAME=zscan_main

# Configuração TypeORM
TYPEORM_LOGGING=false             # true para logging SQL
TYPEORM_SYNCHRONIZE=false         # NUNCA true em produção!

# Configuração JWT
JWT_SECRET=sua-chave-secreta-min-32-caracteres-altere
JWT_REFRESH_SECRET=sua-chave-refresh-min-32-caracteres
JWT_EXPIRATION=900                 # 15 minutos (segundos)
JWT_REFRESH_EXPIRATION=604800     # 7 dias (segundos)

# Configuração Redis
REDIS_HOST=redis                  # "redis" para Docker; "localhost" para local
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600                    # TTL padrão de 1 hora

# Configuração da API
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=debug                   # warn em produção
CORS_ORIGIN=http://localhost:3001 # Produção: apenas seu domínio
```

### Checklist de Implantação em Produção

```
[ ] Definir JWT_SECRET único e criptograficamente seguro (32+ caracteres)
[ ] Definir JWT_REFRESH_SECRET único (32+ caracteres)
[ ] Definir NEXTAUTH_SECRET único (32+ caracteres)
[ ] Alterar DB_PASSWORD para senha forte
[ ] Definir NODE_ENV=production
[ ] Definir LOG_LEVEL=warn
[ ] Configurar senha do Redis se exposto à rede
[ ] Obter e configurar certificado HTTPS/SSL
[ ] Configurar backups automáticos do banco de dados
[ ] Configurar monitoramento e alertas
[ ] Configurar CORS_ORIGIN apenas para o domínio de produção
[ ] Executar migrações do banco de dados com dados de produção
[ ] Testar com volume de dados realista
[ ] Configurar rate limiting na API
[ ] Configurar WAF (Web Application Firewall) se aplicável
[ ] Habilitar cookies apenas HTTPS (flag Secure)
```

---

## 📚 Documentação da API

### Links Rápidos
- **Swagger UI ao vivo**: http://localhost:3000/api/docs
- **JSON OpenAPI**: http://localhost:3000/api/docs-json
- **YAML Swagger**: http://localhost:3000/api/docs-yaml

### Endpoints Principais

#### Autenticação
```
POST   /auth/login                - Email + senha → Tokens JWT
POST   /auth/refresh              - Renovar access token expirado
POST   /auth/logout               - Invalidar refresh token
GET    /auth/me                   - Obter perfil do usuário atual
```

#### Pacientes
```
GET    /patients?page=1&limit=20  - Listar todos os pacientes (paginado)
GET    /patients/search?q=nome    - Buscar por nome/CPF/CNS
POST   /patients                  - Criar novo paciente
GET    /patients/:id              - Obter detalhes do paciente
PATCH  /patients/:id              - Atualizar informações do paciente
DELETE /patients/:id              - Exclusão suave (inativar) paciente
```

#### Agenda/Agendamentos
```
GET    /schedule/day-view?date=2026-04-03
       &professionalIds=uuid1,uuid2
       &statuses=confirmed          - Obter agenda do dia com filtros

GET    /schedule/week-view?startDate=2026-04-03
       - Obter agenda da semana (7 dias)

GET    /schedule/month-view?startDate=2026-04-03
       - Obter agenda do mês (31 dias)

GET    /schedule/availability?date=2026-04-03
       &professionalId=uuid&durationMinutes=30
       - Verificar slots de horário disponíveis

POST   /schedule                  - Criar novo agendamento
GET    /schedule/:id              - Obter detalhes do agendamento
PATCH  /schedule/:id              - Atualizar campos do agendamento
PATCH  /schedule/:id/status       - Alterar status (agendado→confirmado→concluído)
PATCH  /schedule/:id/reschedule   - ✨ Reagendar (usado pelo drag & drop)
DELETE /schedule/:id              - Cancelar agendamento

POST   /schedule/validate/conflicts
       - Validar se novo horário causa conflitos
```

#### Indisponibilidade (Férias/Atestado)
```
GET    /unavailability            - Listar indisponibilidades do profissional
POST   /unavailability            - Criar período de férias/atestado
PATCH  /unavailability/:id        - Atualizar indisponibilidade
DELETE /unavailability/:id        - Remover indisponibilidade
```

#### Tenants (Super Admin)
```
GET    /tenants                   - Listar todos os tenants
POST   /tenants                   - Criar e provisionar novo tenant
GET    /tenants/:id               - Obter detalhes do tenant
PATCH  /tenants/:id               - Atualizar configurações do tenant
GET    /tenants/:id/stats         - Obter estatísticas de uso do tenant
```

### Exemplo: Reagendar Agendamento (Drag & Drop)

```bash
PATCH /schedule/550e8400-e29b-41d4-a716-446655440000/reschedule
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "startTime": "2026-04-03T08:00:00.000",
  "endTime": "2026-04-03T08:30:00.000"
}
```

**Resposta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patientId": "550e8400-e29b-41d4-a716-446655440001",
  "patientName": "João Silva",
  "professionalId": "550e8400-e29b-41d4-a716-446655440002",
  "professionalName": "Dr. Carlos",
  "startTime": "2026-04-03T08:00:00.000Z",
  "endTime": "2026-04-03T08:30:00.000Z",
  "status": "confirmed",
  "updatedAt": "2026-04-03T14:25:30Z"
}
```

**Resposta de Erro (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "Horário conflita com outro agendamento",
  "error": "Conflict"
}
```

---

## 🗄️ Esquema do Banco de Dados

### Diagrama de Relacionamento de Entidades (ASCII)

```
┌───────────────────────────────────────────────────────────────┐
│                         SCHEMA PUBLIC                         │
│                   (Compartilhado por todos os tenants)        │
└───────────────────────────────────────────────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐
│      users           │      │     tenants          │
├──────────────────────┤      ├──────────────────────┤
│ id (UUID, PK)        │◄─┐   │ id (UUID, PK)        │
│ email (VARCHAR, UQ)  │  └───│◄─ id                 │
│ password_hash        │      │ name (VARCHAR)       │
│ tenant_id (FK)       │      │ slug (VARCHAR, UQ)   │
│ role (ENUM)          │      │ schema_name          │
│ created_at           │      │ status (active)      │
│ updated_at           │      │ created_at           │
└──────────────────────┘      └──────────────────────┘


┌───────────────────────────────────────────────────────────────┐
│                     SCHEMA TENANT_X                            │
│              (Por tenant - completamente isolado)             │
└───────────────────────────────────────────────────────────────┘

┌────────────────────────┐    ┌────────────────────────┐
│     patients           │    │   professionals        │
├────────────────────────┤    ├────────────────────────┤
│ id (UUID, PK)          │    │ id (UUID, PK)          │
│ cpf (VARCHAR,UQ,UNN)   │    │ name (VARCHAR)         │
│ cns (VARCHAR,UQ)       │    │ specialization         │
│ full_name (VARCHAR)    │    │ crm (VARCHAR,UQ)       │
│ date_of_birth (DATE)   │    │ status (active/inactive)
│ phone (VARCHAR)        │    │ created_at             │
│ email (VARCHAR)        │    │ updated_at             │
│ address (TEXT)         │    └────────────────────────┘
│ created_at             │              ▲
│ updated_at             │              │ (1:N)
│ deleted_at (soft)      │              │
└────────────────────────┘    ┌────────────────────────┐
      ▲                       │    schedules           │
      │ (N:1)                 ├────────────────────────┤
      │                       │ id (UUID, PK)          │
┌────────────────────────┐    │ patient_id (FK)        │
│    schedules           │    │ professional_id (FK)   │
├────────────────────────┤    │ procedure_type         │
│ id (UUID, PK)          │    │ start_time (TIMESTAMP) │
│ patient_id (FK)        │ ┌──│ end_time (TIMESTAMP)   │
│ professional_id (FK)   │ │  │ status (ENUM)          │
│ start_time (TIMESTAMP) │ │  │ origin (web/api)       │
│ end_time (TIMESTAMP)   │ │  │ notes (TEXT)           │
│ procedure_type         │ │  │ created_by             │
│ status (ENUM)          │ │  │ updated_at             │
│ origin (web/mobile)    │ │  │ deleted_at (soft)      │
│ notes (TEXT)           │ │  └────────────────────────┘
│ created_at             │ │
│ updated_at             │ └─ (schedules.patient_id)
│ deleted_at (soft)      │
└────────────────────────┘

┌────────────────────────────────────────────────┐
│         unavailabilities                       │
├────────────────────────────────────────────────┤
│ id (UUID, PK)                                  │
│ professional_id (FK) → professionals           │
│ type (ENUM: vacation|sick_leave|maintenance)  │
│ start_time (TIMESTAMP)                        │
│ end_time (TIMESTAMP)                          │
│ is_all_day (BOOLEAN)                          │
│ reason (TEXT)                                 │
│ created_at (TIMESTAMP)                        │
│ deleted_at (TIMESTAMP, soft delete)           │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│            audit_logs                          │
├────────────────────────────────────────────────┤
│ id (UUID, PK)                                  │
│ entity_type (VARCHAR: patients|schedules)     │
│ entity_id (UUID)                              │
│ action (ENUM: CREATE|UPDATE|DELETE)           │
│ old_values (JSONB)                            │
│ new_values (JSONB)                            │
│ changed_by (UUID, FK → users)                 │
│ timestamp (TIMESTAMP)                         │
└────────────────────────────────────────────────┘
```

### Fluxo de Trabalho de Status da Agenda

```
         ┌─────────────────────────────────────────┐
         │    CRIAR AGENDAMENTO                    │
         │    Status: 'scheduled'                  │
         └──────────────┬──────────────────────────┘
                        │
        ┌───────────────┼────────────┬────────────────┐
        ▼               ▼            ▼                ▼
   ┌─────────┐  ┌──────────────┐ ┌─────────┐  ┌──────────┐
   │confirmed│  │in_attendance │ │completed│  │cancelled │
   └─────────┘  └──────────────┘ └─────────┘  └──────────┘
                       │
                       ▼
                  ┌──────────┐
                  │ no_show  │
                  └──────────┘

Transições Permitidas:
• scheduled → confirmed: Paciente confirma presença
• confirmed → in_attendance: Consulta inicia
• in_attendance → completed: Consulta termina com sucesso
• Qualquer status → cancelled: Cancelado pela equipe (irreversível)
• Qualquer status → no_show: Paciente não compareceu
```

### Índices Chave (Desempenho)

```sql
-- Desempenho de agendamentos
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_schedules_professional_date 
  ON schedules(professional_id, start_time);
CREATE INDEX idx_schedules_patient_id ON schedules(patient_id);
CREATE INDEX idx_schedules_status ON schedules(status);

-- Busca de pacientes
CREATE UNIQUE INDEX idx_patients_cpf ON patients(cpf);
CREATE INDEX idx_patients_full_name ON patients(full_name);

-- Otimização de disponibilidade
CREATE INDEX idx_unavailability_professional 
  ON unavailabilities(professional_id);
CREATE INDEX idx_unavailability_range 
  ON unavailabilities(start_time, end_time);

-- Trilha de auditoria
CREATE INDEX idx_audit_logs_entity 
  ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## ✨ Visão Geral dos Recursos

### Recursos Principais (Implementados ✅)

#### 1. **Gestão de Pacientes**
- ✅ CRUD completo (Criar, Ler, Atualizar, Deletar)
- ✅ Validação de CPF/CNS (identificadores de saúde brasileiros)
- ✅ Exclusão suave (pode ser recuperado, conforme LGPD)
- ✅ Busca avançada (nome, CPF, CNS, email, telefone)
- ✅ Trilha de auditoria completa (quem, o quê, quando)
- ✅ Gestão de informações de contato e endereço
- ✅ Rastreamento de status (ativo/inativo)

#### 2. **Agendamento de Consultas**
- ✅ Calendário multi-visão (Dia, Semana, Mês)
- ✅ **Reagendamento por Drag & Drop** ✨ (Recém Corrigido - Problemas de Fuso Horário Resolvidos)
- ✅ Detecção de conflitos em tempo real
- ✅ Cálculo inteligente de disponibilidade
- ✅ Indisponibilidade de profissionais (férias, atestado)
- ✅ Fluxo de trabalho de status (agendado → confirmado → concluído/falta)
- ✅ Notas do agendamento e rastreamento de origem
- ✅ Categorização por tipo de procedimento

#### 3. **Multi-Tenancy**
- ✅ Isolamento completo de esquema por tenant
- ✅ Provisionamento automático de esquema
- ✅ Resolução de tenant a partir do JWT
- ✅ Registro de auditoria por tenant
- ✅ Estatísticas e relatórios independentes

#### 4. **Autenticação e Autorização**
- ✅ Autenticação baseada em JWT
- ✅ Estratégia de refresh token (15 min access, 7 dias refresh)
- ✅ Cookies httpOnly seguros para refresh tokens
- ✅ Controle de acesso baseado em função (médico, recepcionista, admin)
- ✅ Proteção CORS
- ✅ Hash de senha com bcrypt

#### 5. **Desempenho e Cache**
- ✅ Cache multi-camadas com Redis
- ✅ Invalidação inteligente de cache
- ✅ Otimização de consultas ao banco de dados
- ✅ Paginação para grandes conjuntos de dados
- ✅ Pooling de conexões

#### 6. **Interface do Usuário**
- ✅ Frontend moderno com React/Next.js
- ✅ Design totalmente responsivo (amigável para dispositivos móveis)
- ✅ Validação de formulários em tempo real
- ✅ Notificações toast
- ✅ Tratamento e recuperação de erros
- ✅ Estados de carregamento e skeletons
- ✅ Suporte a modo escuro (Tailwind CSS)

#### 7. **Integridade de Dados e Conformidade**
- ✅ Registro de auditoria completo (trilha imutável)
- ✅ Exclusão suave (conforme LGPD)
- ✅ Detecção e prevenção de conflitos
- ✅ Validação de dados em múltiplas camadas

---

## 🎯 Reagendamento por Drag & Drop (Novo)

### Funcionalidades
- ✅ Arrastar agendamentos entre slots de horário
- ✅ Detecção de conflitos em tempo real
- ✅ Preservação automática da duração
- ✅ Feedback visual ao passar o mouse
- ✅ Desfazer/recuperação de erros
- ✅ Validação de indisponibilidade do profissional

### Usando Drag & Drop

1. **Abrir Agenda** → Navegar para a página Agenda
2. **Selecionar Aba "Drag & Drop"** → Visualizar calendário em modo drag-drop
3. **Arrastar Agendamento** → Do painel esquerdo para o slot de horário desejado à direita
4. **Feedback Visual** → Zonas de soltar destacadas, mensagens de erro
5. **Salvamento Automático** → Reagendamento persistido no banco de dados

### Correção de Fuso Horário

**Problema:** Arrastar para as 8:00 AM estava salvando como 11:00 AM (diferença de 3 horas em certos fusos horários)

**Causa Raiz:** O `new Date()` do JavaScript interpreta strings de data de forma diferente com base no fuso horário do navegador

**Solução Implementada:**
```typescript
// Converter para formato de horário local "ingênuo" (sem sufixo Z)
function toLocalDateTime(date: Date) {
  return `2026-04-03T08:00:00.000`;  // Sem Z = horário local
}

// Backend interpreta como equivalente a UTC (preserva o horário original)
```

**Resultado:** Drag & drop agora preserva corretamente o horário local em todos os fusos horários

---

## 📂 Estrutura do Projeto

### Estrutura Completa do Backend (NestJS)

```
api/src/
├── main.ts                              # Ponto de entrada, configuração Swagger
├── app.module.ts                        # Módulo raiz, importa todos os módulos
│
├── config/
│   ├── typeorm.config.ts               # Configuração DB multi-tenant
│   └── cache.config.ts                 # Configuração Redis
│
├── common/                             # Utilitários compartilhados
│   ├── decorators/
│   │   ├── current-tenant.decorator.ts # @CurrentTenant() → extrai do JWT
│   │   ├── current-user.decorator.ts   # @CurrentUser() → extrai do JWT
│   │   └── public.decorator.ts         # @Public() → ignora JWT
│   │
│   ├── filters/
│   │   └── http-exception.filter.ts    # Tratamento global de erros
│   │
│   ├── guards/
│   │   ├── jwt.guard.ts               # Validação JWT
│   │   ├── tenant.guard.ts            # Validação de tenant
│   │   └── roles.guard.ts             # Controle de acesso baseado em função
│   │
│   ├── interfaces/
│   │   ├── jwt-payload.interface.ts   # Estrutura JWT
│   │   └── tenant-context.interface.ts
│   │
│   ├── middleware/
│   │   └── tenant.middleware.ts       # Troca automática para schema do tenant
│   │
│   ├── pipes/
│   │   ├── validation.pipe.ts         # Validação de DTO
│   │   └── parse-uuid.pipe.ts         # Parsing e validação de UUID
│   │
│   └── services/
│       ├── tenant-data-source.ts      # Conexões DB multi-tenant
│       └── cache.service.ts           # Métodos auxiliares Redis
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts         # POST /auth/login, /auth/refresh
│   │   ├── auth.service.ts            # Geração JWT, validação de token
│   │   ├── auth.module.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── refresh.dto.ts
│   │
│   ├── patients/
│   │   ├── patients.controller.ts     # Endpoints CRUD
│   │   ├── patients.service.ts        # Lógica de negócio
│   │   ├── patients.module.ts
│   │   ├── entities/patient.entity.ts
│   │   └── dto/
│   │       ├── create-patient.dto.ts
│   │       ├── update-patient.dto.ts
│   │       └── patient-search.dto.ts
│   │
│   ├── schedule/
│   │   ├── schedule.controller.ts     # day-view, reschedule, validate
│   │   ├── schedule.service.ts        # Detecção de conflitos, disponibilidade
│   │   ├── schedule.module.ts
│   │   ├── entities/
│   │   │   ├── schedule.entity.ts
│   │   │   └── unavailability.entity.ts
│   │   ├── dto/
│   │   │   ├── create-schedule.dto.ts
│   │   │   ├── update-schedule.dto.ts
│   │   │   └── reschedule.dto.ts
│   │   └── services/
│   │       ├── conflict-detection.service.ts
│   │       └── availability.service.ts
│   │
│   ├── tenants/
│   │   ├── tenants.controller.ts     # Gestão de tenants
│   │   ├── tenants.service.ts        # Provisionamento de esquema
│   │   ├── tenants.module.ts
│   │   ├── entities/tenant.entity.ts
│   │   └── dto/create-tenant.dto.ts
│   │
│   └── shared/
│       ├── entities/                  # Todos os modelos de dados
│       │   ├── user.entity.ts
│       │   ├── patient.entity.ts
│       │   ├── schedule.entity.ts
│       │   ├── professional.entity.ts
│       │   ├── unavailability.entity.ts
│       │   ├── audit-log.entity.ts
│       │   └── tenant.entity.ts
│       │
│       ├── dtos/
│       │   └── pagination.dto.ts
│       │
│       └── services/
│           ├── audit.service.ts      # Registro de trilha de auditoria
│           └── cache.service.ts      # Métodos Redis
│
└── database/
    ├── migrations/
    │   ├── 1680000000000-InitialSchema.ts
    │   ├── 1680000001000-AddSchedules.ts
    │   └── ...
    └── seeders/
        └── seed.ts
```

### Estrutura Completa do Frontend (Next.js + React)

```
web/
├── app/                                  # Next.js 13+ App Router
│   ├── layout.tsx                       # Layout raiz + providers
│   ├── page.tsx                         # Página inicial do dashboard
│   ├── globals.css                      # Globais do Tailwind
│   │
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx                # Página de login
│   │
│   ├── patients/
│   │   ├── page.tsx                    # Lista de pacientes
│   │   ├── new/page.tsx                # Criar paciente
│   │   └── [id]/
│   │       └── page.tsx                # Detalhes/edição do paciente
│   │
│   ├── schedule/
│   │   └── page.tsx                    # Visualizações do calendário
│   │
│   └── api/
│       └── auth/
│           └── [...nextauth].ts        # Manipulador NextAuth
│
├── components/
│   ├── auth/
│   │   └── login-form.tsx              # Formulário de login
│   │
│   ├── patients/
│   │   ├── patient-form.tsx            # Formulário de criação/edição
│   │   ├── patient-modal.tsx           # Modal de detalhes
│   │   ├── patient-table.tsx           # Tabela de listagem
│   │   └── search-bar.tsx              # Componente de busca
│   │
│   ├── schedule/
│   │   ├── day-view.tsx                # Visualização de calendário por dia
│   │   ├── week-view.tsx               # Visualização de calendário por semana
│   │   ├── month-view.tsx              # Visualização de calendário por mês
│   │   ├── drag-drop-schedule.tsx      # Visualização drag & drop
│   │   ├── schedule-filter-bar.tsx     # Filtragem
│   │   ├── schedule-modal.tsx          # Criar/editar agendamento
│   │   ├── unavailability-modal.tsx    # Férias/atestado
│   │   ├── conflict-detection.tsx      # Aviso de conflito
│   │   └── event-card.tsx              # Evento do agendamento
│   │
│   └── ui/                              # Componentes UI reutilizáveis
│       ├── button.tsx
│       ├── card.tsx
│       ├── modal.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── ... (componentes shadcn/ui)
│
├── lib/
│   ├── api-client.ts                   # Axios + interceptadores de autenticação
│   ├── use-auth.ts                     # Hook de autenticação
│   ├── use-schedule.ts                 # Consultas/mutações de agenda
│   ├── use-patients.ts                 # Hooks de pacientes
│   ├── use-unavailability.ts           # Hooks de indisponibilidade
│   ├── format.ts                       # Formatação de data/número
│   ├── utils.ts                        # Utilitários gerais
│   └── constants.ts                    # Constantes da aplicação
│
├── hooks/
│   ├── useAuth.ts
│   ├── useSchedule.ts
│   ├── useNotification.ts
│   └── useResponsive.ts
│
├── types/
│   ├── patient.ts
│   ├── schedule.ts
│   ├── auth.ts
│   └── common.ts
│
├── schemas/
│   └── index.ts                        # Esquemas de validação Zod
│
├── Dockerfile
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 🛠️ Stack Técnico

### Stack do Backend

| Camada | Tecnologia | Versão | Justificativa |
|--------|------------|--------|---------------|
| **Runtime** | Node.js | 18+ | Padrão da indústria, excelente suporte a async/await |
| **Framework** | NestJS | 9.x | Arquitetura empresarial, TypeScript-first, contêiner DI |
| **Linguagem** | TypeScript | 5.x | Segurança de tipos, melhor suporte da IDE, captura bugs em tempo de compilação |
| **Banco de Dados** | PostgreSQL | 15 | Conformidade ACID, suporte JSON, capacidades multi-schema |
| **ORM** | TypeORM | 0.3.x | Integração nativa com NestJS, sistema de migrações, consultas type-safe |
| **Cache** | Redis | 7.x | Desempenho em memória, padrões de cache, suporte pub/sub |
| **Autenticação** | JWT + Passport | Última | Stateless, escalável, padrão da indústria |
| **Validação** | class-validator | 0.14.x | Validação de DTO com decoradores, validação assíncrona |
| **Documentação API** | Swagger | 6.x | Gerada automaticamente, documentação interativa |
| **Testes** | Jest | 29.x | Testes unitários/de integração, snapshot testing, mocking |
| **Linting** | ESLint | Última | Consistência de código, captura de bugs potenciais |
| **Formatação** | Prettier | Última | Aplicação de estilo de código, auto-formatação |

### Stack do Frontend

| Camada | Tecnologia | Versão | Justificativa |
|--------|------------|--------|---------------|
| **Framework** | Next.js | 13+ | App Router, Server Components, desempenho otimizado |
| **Biblioteca UI** | React | 18.x | Baseado em componentes, hooks, suspense, excelente ecossistema |
| **Componentes UI** | shadcn/ui | Última | Acessíveis, estilizados com Tailwind, abordagem copiar-colar-modificar |
| **Estilização** | Tailwind CSS | 3.x | Utility-first, design responsivo, modo escuro |
| **Gerenciamento de Estado** | React Query | 4.x | Cache de estado do servidor, sincronização em segundo plano, auto-refetch |
| **Validação** | Zod | Última | TypeScript-first, validação em runtime, mensagens de erro |
| **Cliente HTTP** | Axios | 1.x | Interceptadores, cancelamento de requisições, suporte a timeout |
| **Ícones** | Lucide React | Última | Bonitos, consistentes, ícones tree-shakeable |
| **Formulários** | React Hook Form | Última | Performático, flexível, re-renderizações mínimas |
| **Drag & Drop** | @dnd-kit | Última | Moderno, agnóstico de framework, acessibilidade first |
| **Manipulação de Datas** | date-fns | 2.x | Leve, funções puras, suporte i18n |
| **Testes** | Jest + RTL | Última | Testes de componentes, testes de acessibilidade |

### DevOps e Implantação

| Ferramenta | Propósito |
|------------|-----------|
| **Docker** | Containerização para ambientes consistentes |
| **Docker Compose** | Orquestração para desenvolvimento local e implantação single-host |
| **Winston** | Logging estruturado com níveis e transportes |

---

## Limitações e Trabalhos Futuros

### Limitações Conhecidas

#### 1. **Sem Suporte a WebSocket em Tempo Real** (Status: Polling)
- **Problema**: Atualizações do calendário usam HTTP polling (atraso de 5-10 segundos)
- **Impacto**: Atualizações de outros usuários não são imediatamente visíveis
- **Solução alternativa**: Atualização manual da página (F5)
- **Implementação Planejada**: Fase 2 - Conexão WebSocket com Socket.io
- **ETA**: 2-3 semanas de desenvolvimento

#### 2. **Casos Extremos de Fuso Horário** (Recém Melhorado ✅)
- **Status**: Problema principal CORRIGIDO com conversão `toLocalDateTime()`
- **Restante**: Transições de horário de verão (DST) podem precisar de testes
- **Atual**: Funciona corretamente para transições não-DST

#### 3. **Sem Agendamentos Recorrentes**
- **Problema**: Deve criar cada agendamento manualmente
- **Impacto**: Sessões de terapia repetidas, check-ups regulares precisam de duplicação
- **Solução alternativa**: Criar template de série, equipe cria a partir do template
- **Planejado**: Recurso da Fase 3 (suporte iCal, regras de recorrência)
- **ETA**: 2-4 semanas de desenvolvimento

#### 4. **Relatórios e Análises Limitados**
- **Atual**: Apenas estatísticas básicas (total, agendados, disponíveis)
- **Ausente**: Relatórios de receita, taxas de utilização, análise de faltas, tendências
- **Planejado**: Fase 4 - Dashboard completo de análises
- **ETA**: 3-4 semanas de desenvolvimento

#### 5. **Sem Agendamentos Multi-Profissional**
- **Problema**: Cirurgias que exigem 2+ médicos devem criar registros separados
- **Impacto**: Procedimentos complexos mais difíceis de coordenar
- **Solução alternativa**: Criar agendamento com médico principal, notas referenciam membros da equipe
- **Planejado**: Fase 3 - Capacidades de agendamento em equipe
- **ETA**: 2-3 semanas

#### 6. **Apenas Exclusão Suave (Por Design)**
- **Decisão de Design**: Suporta conformidade com LGPD (recuperação possível)
- **Problema**: Grande volume de dados ao longo do tempo
- **Solução**: Arquivar registros antigos para banco de dados separado após período de retenção (90 dias)
- **Não Planejado**: Exclusão permanente é intencionalmente excluída

#### 7. **Template de Disponibilidade Único**
- **Problema**: Não é possível definir "Dr. Silva trabalha Seg-Sex mas quarta-feira folga"
- **Impacto**: Padrões de disponibilidade complexos precisam de soluções alternativas
- **Atual**: Disponibilidade global + períodos de indisponibilidade ad-hoc
- **Planejado**: Fase 2 - Templates de disponibilidade por data específica
- **ETA**: 1-2 semanas

#### 8. **Sem Notificações por Email** (Integração Futura)
- **Ausente**: Confirmações de agendamentos, lembretes de 24h, avisos de cancelamento
- **Solução alternativa**: Contato manual pela equipe de recepção
- **Planejado**: Integração da Fase 2 com SendGrid/AWS SES
- **ETA**: 1 semana de desenvolvimento

#### 9. **Sem Lembretes por SMS**
- **Ausente**: SMS 24h antes do agendamento reduz taxa de falta
- **Solução alternativa**: Ligações telefônicas pela recepção
- **Planejado**: Integração da Fase 2 com Twilio
- **ETA**: 1 semana de desenvolvimento

#### 10. **Responsividade Móvel Limitada**
- **Status**: UI responsiva, mas não otimizada para fluxos de trabalho móveis
- **Ausente**: Gestos de toque, otimizações específicas para dispositivos móveis
- **Planejado**: Aplicativo móvel nativo (React Native) na Fase 5
- **ETA**: 6-8 semanas de desenvolvimento

---

### Roteiro: O Que Eu Implementaria com Mais Tempo

#### ⏱️ **Curto Prazo (1-2 semanas)**
- [ ] Notificações por email (integração SendGrid)
- [ ] Dashboard de auditoria (visualizar todas as alterações por paciente/agendamento)
- [ ] Melhores mensagens de erro com sugestões
- [ ] Exportar agendas para iCal/PDF
- [ ] Dashboard de monitoramento de desempenho

#### ⏱️ **Médio Prazo (2-4 semanas)**
- [ ] Atualizações em tempo real com WebSocket (Socket.io)
- [ ] Agendamentos recorrentes (diário/semanal/mensal)
- [ ] Filtragem avançada com templates salvos
- [ ] Gerenciamento de fila de walk-in
- [ ] Lembretes por SMS (Twilio)
- [ ] Balanceamento de carga de profissionais (atribuição automática de slots próximos)

#### ⏱️ **Longo Prazo (1-2 meses)**
- [ ] Aplicativo móvel nativo (React Native)
- [ ] Análises e relatórios avançados
- [ ] Integração com telemedicina (Jitsy Meet)
- [ ] Integração com operadoras de saúde
- [ ] Gateway de pagamento (Stripe/PayPal)
- [ ] Integração com sistemas EHR
- [ ] Otimização de agendamento por IA
- [ ] Busca em linguagem natural

---

## 🆘 Solução de Problemas

### Problema: "Não é possível conectar ao banco de dados"

**Solução:**
```bash
# 1. Verificar se o container do banco está em execução
docker ps | grep db

# 2. Visualizar logs
docker logs zscan-db --tail=50

# 3. Conectar diretamente
docker exec zscan-db psql -U zscan -d zscan_main -c "SELECT 1;"

# 4. Se ainda falhar, reiniciar
docker-compose down
docker-compose up -d db
```

### Problema: Drag & Drop mostra horário errado (Problema Antigo - Agora Corrigido ✅)

**Status**: Este ERA um problema conhecido de fuso horário.

**Correção Aplicada**: 
- Frontend agora usa o helper `toLocalDateTime()`
- Envia horário local sem sufixo Z
- Backend interpreta corretamente
- Resultado: ✅ Preservação correta do horário

**Se ainda ocorrer:**
```bash
# Verificar console do navegador (F12 → Console)
# Procurar por logs: "Reagendando agendamento"
# Verificar se o offset de fuso horário está correto
# Reiniciar frontend: docker restart zscan-web
```

### Problema: "502 Bad Gateway" do frontend

**Solução:**
```bash
# 1. Verificar se a API está em execução
curl http://localhost:3000/health

# 2. Visualizar erros da API
docker logs zscan-api --tail=100

# 3. Verificar conectividade de rede
docker network inspect zscan_zscan-network

# 4. Reiniciar API
docker restart zscan-api
```

### Problema: "Porta já está em uso"

**Solução:**
```bash
# Windows PowerShell
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Matar processo
taskkill /PID <PID> /F

# Ou alterar porta no .env e reiniciar
```

### Problema: "Schema do tenant não encontrado"

**Solução:**
```bash
# Verificar tenant no banco de dados
docker exec zscan-db psql -U zscan -d zscan_main \
  -c "SELECT * FROM public.tenants;"

# Verificar se o schema existe
docker exec zscan-db psql -U zscan -d zscan_main \
  -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

# Se ausente, criar via API
curl -X POST http://localhost:3000/tenants \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Minha Clínica","slug":"minha-clinica"}'
```

### Problema: Agendamento não aparece após criação

**Solução:**
```bash
# 1. Verificar console do navegador para erros (F12)

# 2. Testar API diretamente
curl -X GET "http://localhost:3000/schedule/day-view?date=2026-04-03" \
  -H "Authorization: Bearer {TOKEN}"

# 3. Limpar cache Redis
docker exec zscan-redis redis-cli FLUSHALL

# 4. Reiniciar API
docker restart zscan-api
```

### Problema: Consultas lentas ou problemas de desempenho

**Solução:**
```bash
# 1. Habilitar logging de consultas
# Editar api/.env: TYPEORM_LOGGING=true
# Reiniciar: docker restart zscan-api

# 2. Verificar se Redis está funcionando
docker exec zscan-redis redis-cli INFO stats

# 3. Verificar se os índices existem
docker exec zscan-db psql -U zscan -d zscan_main -c "\di"

# 4. Verificar conexões ativas
docker exec zscan-db psql -U zscan -d zscan_main \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

---

##  Suporte e Documentação

- **Documentação Completa de Arquitetura**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Guia de Desenvolvimento**: [GETTING_STARTED.md](GETTING_STARTED.md)
- **Status de Desenvolvimento**: [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md)
- **Configuração Docker**: [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)
- **Swagger da API**: http://localhost:3000/api/docs

---

- **Shadcn/UI** - Componentes 
- **date-fns** - Manipulação confiável de datas
- **@dnd-kit** - Biblioteca moderna de drag-and-drop
- **NestJS** - Excelente framework backend
- **Next.js** - Framework React incrível
- **TailwindCSS** - Framework CSS utility-first

---

**Última Atualização**: 3 de Abril de 2026  
**Versão**: 1.0.0 (Pronto para Produção)  
**Status**: ✅ Totalmente Funcional - Todos os Recursos Principais Implementados
```