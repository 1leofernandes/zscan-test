# Setup & Deployment Guide - ZScan Health System

## Quick Start (Development)

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

### Option 1: Docker Compose (Recommended)

```bash
# Clone or navigate to project root
cd /path/to/zscan

# Create required directories
mkdir -p .docker/postgres

# Create .env file from template
cp .env.example .env

# Start all services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Check logs if needed
docker-compose logs -f api
docker-compose logs -f web
```

**Services will be available at:**
- Frontend: http://localhost:3001
- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Local Development

#### 1. Backend Setup

```bash
cd /path/to/zscan/api

# Install dependencies
npm install

# Create .env file (copy from template)
cp ../.env.example .env

# Update .env for local database
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=zscan
# DB_PASSWORD=zscan123
# DB_NAME=zscan_main
# REDIS_HOST=localhost
# REDIS_PORT=6379

# Start PostgreSQL (if not using Docker)
# macOS (Homebrew): brew services start postgresql
# Linux (Ubuntu): sudo systemctl start postgresql
# Windows: Use PostgreSQL installer GUI or services

# Start Redis (if not using Docker)
# macOS (Homebrew): brew services start redis
# Linux (Ubuntu): sudo systemctl start redis-server
# Windows: Use memurai or WSL

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

#### 2. Frontend Setup

```bash
cd /path/to/zscan/web

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3001
EOF

# Start development server
npm run dev
```

#### 3. First Time Setup

After services are running:

```bash
# 1. Create first tenant (via API or database)
curl -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Clinic",
    "domain": "dev.zscan.local"
  }'

# 2. Update your /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
# Add these lines:
# 127.0.0.1 localhost
# 127.0.0.1 dev.zscan.local
# 127.0.0.1 clinic1.zscan.local

# 3. Login at http://dev.zscan.local:3001
# Default credentials will be provided after tenant creation
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                    │
│                    Port: 3001                               │
│  • React Components with shadcn/ui                          │
│  • React Hook Form + Zod validation                         │
│  • React Query for server state                             │
│  • Real-time WebSocket support                              │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/WebSocket
                 │ (JWT Bearer Token)
┌────────────────▼────────────────────────────────────────────┐
│                   Backend (NestJS 10)                       │
│                    Port: 3000                               │
│ ┌─ Auth Module                                              │
│ ├─ Tenants Module (Multi-tenant provisioning)              │
│ ├─ Patients Module (CRUD + caching)                        │
│ └─ Schedule Module (Agenda + availability)                 │
└────────────────┬────────────────────────────────────────────┘
                 │ SQL/Redis Commands
    ┌────────────┴──────────────┬───────────────┐
    │                           │               │
┌───▼────────────┐  ┌───────────▼──────┐  ┌────▼──────────┐
│  PostgreSQL    │  │  Redis Cache    │  │  S3 Storage  │
│  Multi-Schema │  │  Sessions (5min) │  │  (Optional)  │
│  (per tenant)  │  │  Config (1h)    │  │              │
└────────────────┘  └─────────────────┘  └───────────────┘
```

### Multi-Tenancy Design

**Schema-per-Tenant** architecture:
- One PostgreSQL `public` schema for all tenants (users, tenants, audit_logs)
- One dedicated schema per tenant tenant_clinic_a`, `tenant_clinic_b`, etc.)
- Each tenant's data is completely isolated
- Easy to backup/restore individual tenants
- Allows scaling: move tenant schema to different database as needed

**Request Flow:**
```
1. Request arrives with subdomain (clinic1.zscan.local)
2. TenantMiddleware resolves tenant from domain/header
3. Set PostgreSQL search_path to tenant_clinic1
4. All subsequent queries automatically scoped to tenant schema
5. JwtAuthGuard validates JWT contains correct tenantId
6. TenantGuard ensures tenant isolation
```

---

## Database

### Schema Structure

**Public Schema (shared across tenants):**
- `tenants` - All clinic records
- `users` - All users (cross-tenant)
- `permissions` - RBAC definitions
- `refresh_tokens` - JWT token management
- `audit_logs_public` - Cross-tenant audit trail

**Tenant Schema (per clinic):**
- `patients` - Patient records (soft delete)
- `schedules` - Appointments with status tracking
- `audit_logs` - Full change history

### Migrations (TypeORM)

```bash
# From api directory:

# Create a new migration
npm run migration:create -- src/database/migrations/add-new-feature

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Database Backup

```bash
# Backup specific tenant schema
docker exec zscan-db pg_dump -U zscan zscan_main -n tenant_clinic_a > backup_clinic_a.sql

# Backup entire database
docker exec zscan-db pg_dump -U zscan zscan_main > backup_full.sql

# Restore a backup
docker exec -i zscan-db psql -U zscan zscan_main < backup_full.sql
```

---

## Authentication & Authorization

### JWT Flow

```
1. POST /auth/login { email, password, tenantId }
   ↓
2. Validate credentials (bcrypt)
   ↓
3. Return: {
     accessToken: "eyJhbGc...",      // Expires: 15 minutes
     refreshToken: "eyJhbGc...",     // Expires: 7 days
     user: { id, email, role, name }
   }
   ↓
4. Client stores tokens in localStorage
   ↓
5. Each request includes: Authorization: Bearer {accessToken}
   ↓
6. When expired: POST /auth/refresh { refreshToken }
```

### Permissions by Role

| Resource | Admin | Clinician | Receptionist |
|----------|-------|-----------|--------------|
| Patients | CRUD  | RU        | CRU          |
| Schedules| CRUD  | RU        | CRU          |
| Users    | CRUD  | -         | -            |
| Reports  | CRU   | R         | R            |

---

## API Documentation

### Key Endpoints

**Authentication:**
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Refresh access token
- `POST /auth/signup` - Register new clinic

**Patients:**
- `GET /patients` - List patients (paginated, searchable)
- `POST /patients` - Create patient
- `GET /patients/:id` - Get patient details
- `PATCH /patients/:id` - Update patient
- `DELETE /patients/:id` - Soft delete patient

**Schedules:**
- `GET /schedule/day?date=2024-01-15` - Day view
- `GET /schedule/week?weekStart=2024-01-15` - Week view
- `GET /schedule/availability?date=2024-01-15&professionalId=...` - Available slots
- `POST /schedule` - Create appointment
- `PATCH /schedule/:id/status` - Update appointment status

**Full API docs:** http://localhost:3000/api/docs (Swagger)

---

## Caching Strategy

**Redis Usage:**

```
// Cache Keys
patient:clinic1:search:{query}       // Expires: 30min
schedule:clinic1:availability:{date} // Expires: 15min
user:clinic1:permissions:{userId}    // Expires: 30min
session:{tokenId}                    // Expires: 5min
```

**Cache Invalidation:**
- Patient creation/update/delete → Invalidate patient searches
- Schedule creation/update/delete → Invalidate availability
- User permission change → Invalidate permission cache

---

## Deployment

### Production Build

```bash
# Backend
cd api
npm run build
# Output: dist/ folder with compiled JavaScript

# Frontend
cd web
npm run build
# Output: .next/ folder with optimized production build
```

### Environment Variables (Production)

Create `.env` with:

```bash
# Security
NODE_ENV=production
JWT_SECRET=<super-secret-key-min-32-chars>
JWT_REFRESH_SECRET=<different-secret-key>
NEXTAUTH_SECRET=<another-secret-key>

# Database
DB_HOST=db.production.com
DB_PORT=5432
DB_USER=zscan_prod
DB_PASSWORD=<strong-password>
DB_NAME=zscan_prod

# Redis
REDIS_HOST=redis.production.com
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>

# URLs
API_URL=https://api.zscan.com
NEXT_PUBLIC_API_URL=https://api.zscan.com
NEXTAUTH_URL=https://app.zscan.com

# Logging
LOG_LEVEL=info

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
```

### Docker Production Deployment

```bash
# Build production images
docker build -t zscan-api:latest ./api
docker build -t zscan-web:latest ./web

# Push to registry
docker tag zscan-api:latest myregistry.azurecr.io/zscan-api:latest
docker push myregistry.azurecr.io/zscan-api:latest

# Deploy with Kubernetes, AWS ECS, or Docker Swarm
# See docker-compose.yml for production deployment config
```

### Health Checks

```bash
# API health
curl http://api.zscan.com/health

# Frontend health
curl http://app.zscan.com/api/health

# Database connection
docker exec zscan-db psql -U zscan -t -c "SELECT 1"

# Redis connection
docker exec zscan-redis redis-cli ping
```

---

## Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web

# With timestamps
docker-compose logs -f --timestamps

# Last 100 lines
docker-compose logs --tail=100
```

### Performance Metrics

```bash
# Check Redis memory usage
docker exec zscan-redis redis-cli INFO memory

# Check database connections
docker exec zscan-db psql -U zscan -t -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Database query performance
docker exec zscan-db psql -U zscan -c \
  "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection from container
docker exec zscan-api npm run typeorm migration:show

# Check database is running
docker-compose ps db

# Recreate database
docker-compose down -v  # Remove volume!
docker-compose up db
```

### Redis Connection Issues

```bash
# Test Redis connection
docker exec zscan-redis redis-cli ping

# Check Redis memory
docker exec zscan-redis redis-cli INFO stats
```

### JWT Token Issues

```bash
# Verify token
curl -H "Authorization: Bearer {token}" http://localhost:3000/auth/me

# Check token expiry
echo {token} | jq -R 'split(".") | .[1] | @base64d | fromjson'
```

---

## Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/patient-search

# Make changes, commit
git commit -m "feat: add patient search by CPF"

# Create pull request for code review
```

### Testing

```bash
# Backend tests
cd api
npm test

# Frontend tests
cd web
npm run test

# End-to-end tests
npm run test:e2e
```

### Code Quality

```bash
# ESLint check
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

---

## Performance Optimization

### Frontend Optimization
- ✅ Next.js Image Optimization (automatic)
- ✅ Code splitting (dynamic imports)
- ✅ React Query caching strategy
- ✅ Memoization with React.memo
- ✅ CSS-in-JS with Tailwind (purged in production)

### Backend Optimization
- ✅ Database indexing on CPF, dates, patient_id
- ✅ Redis caching with TTL
- ✅ Query pagination (max 100 per page)
- ✅ TypeORM lazy relations to prevent N+1
- ✅ Connection pooling (pg default: 10 connections)

### Database Optimization
```sql
-- Key indices for performance
CREATE INDEX idx_patients_cpf ON patients(cpf);
CREATE INDEX idx_schedules_patient_id ON schedules(patient_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM patients WHERE cpf = '12345678901';
```

---

## Support & Maintenance

### Regular Maintenance Tasks

- **Daily:** Monitor error logs, backups completed
- **Weekly:** Review database performance metrics, update dependencies
- **Monthly:** Security audit, capacity planning check
- **Quarterly:** Full system testing, disaster recovery drill

### Emergency Procedures

**Database Corruption:**
```bash
docker-compose down -v
docker volume rm zscan_postgres_data
docker-compose up
# Restore from backup if available
```

**Service Failure:**
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```

**Disk Space Issues:**
```bash
# Clean up old Docker images/containers
docker system prune -a
docker volume prune
```

---

## References

- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [TypeORM Docs](https://typeorm.io/)
- [Prisma Documentation](https://www.prisma.io/docs/)
