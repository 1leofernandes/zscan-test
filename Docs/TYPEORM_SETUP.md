# TypeORM & Database Connection Setup

## Configuration Files

### 1. TypeORM Configuration
**File**: `api/src/config/typeorm.config.ts`

```typescript
export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'db'),        // Docker: 'db', Local: 'localhost'
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USER', 'zscan'),
  password: configService.get('DB_PASSWORD', 'zscan123'),
  database: configService.get('DB_NAME', 'zscan_main'),
  entities: ['dist/**/*.entity{.ts,.js}'],           // Compiled entities
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  migrationsTableName: '_migrations',                // Tracks executed migrations
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  cache: true,
  dropSchema: false,
  installExtensions: true,
  extra: {
    max: 20,                                         // Max connections in pool
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 60000,
  },
});
```

### 2. AppModule Configuration
**File**: `api/src/app/app.module.ts`

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfig } from '../config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

---

## Database Connection Verification

### 1. Check Connection Inside Docker

```bash
# From API container
docker compose exec api node -e "
  const { DataSource } = require('typeorm');
  const config = require('./dist/config/typeorm.config.js');
  const ds = new DataSource(config.default({}));
  ds.initialize()
    .then(() => console.log('✅ Database connected successfully'))
    .catch(err => console.error('❌ Connection error:', err.message))
    .finally(() => process.exit(0));
"
```

### 2. Verify from Database Container

```bash
# Connect directly to PostgreSQL
docker compose exec db psql -U zscan -d zscan_main -c "SELECT version();"

# List all tables
docker compose exec db psql -U zscan -d zscan_main -c "\dt public.*"

# Check migrations table
docker compose exec db psql -U zscan -d zscan_main -c "SELECT * FROM _migrations;"
```

### 3. Test with API Health Endpoint

```bash
# Should respond with 200
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2024-04-03T10:00:00.000Z","version":"1.0.0"}
```

---

## Running Migrations

### Auto-run on Startup (Development)

When `NODE_ENV=development`, TypeORM automatically:
1. Checks for new migration files
2. Executes pending migrations
3. Updates `_migrations` table

### Manual Migration

```bash
# Inside api directory
npm run typeorm migration:run

# Create new migration
npm run typeorm migration:create -- -n CreateUsersTable

# Revert last migration
npm run typeorm migration:revert
```

### Docker Container

```bash
# Run migrations inside container
docker compose exec api npm run typeorm migration:run

# Check migration status
docker compose exec api npm run typeorm migration:show
```

---

## Environment Variables for TypeORM

**Required in .env**:

```env
# Database Connection
DB_HOST=db                 # 'db' for Docker, 'localhost' for local
DB_PORT=5432
DB_USER=zscan
DB_PASSWORD=zscan123
DB_NAME=zscan_main

# API Configuration
NODE_ENV=development       # 'development' enables logging and sync
API_PORT=3000

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

**Docker Overrides in docker-compose.yml**:

```yaml
environment:
  DB_HOST: db              # Docker service name (overrides localhost)
  DB_PORT: 5432            # Internal Docker port
  NODE_ENV: development    # Enables TypeORM logging
```

---

## Troubleshooting

### Error: "Cannot find module 'dist/config/typeorm.config.js'"

**Cause**: Application hasn't been compiled

**Solution**:
```bash
# Add build step to docker-compose
docker compose build --no-cache api

# Or manually build
npm run build
```

### Error: "connect ECONNREFUSED 127.0.0.1:5432"

**Cause**: DB_HOST is still 'localhost' instead of 'db' in Docker

**Solution**:
```bash
# Update .env for Docker
sed -i 's/DB_HOST=localhost/DB_HOST=db/' .env

# Or manually edit .env
DB_HOST=db
```

### Error: "password authentication failed for user 'zscan'"

**Cause**: Incorrect password in .env

**Solution**:
```bash
# Verify .env matches initialization
cat .env | grep DB_PASSWORD

# Should match docker-compose.yml environment section
```

### Migration Not Running

**Cause**: Migrations table doesn't exist or path is incorrect

**Solution**:
```bash
# Check migrations table
docker compose exec db psql -U zscan -d zscan_main -c "SELECT * FROM _migrations;"

# Verify migration files exist
ls -la api/dist/database/migrations/

# Check logs
docker compose logs -f api | grep -i migration
```

### Connection Pool Exhaustion

**Symptoms**: "Error: connect: ENOMEM" or timeout errors

**Solution**:
```typescript
// Increase connection pool in typeorm.config.ts
extra: {
  max: 50,  // Increase from 20
  idleTimeoutMillis: 30000,
}
```

---

## Monitoring Database Connections

### Active Connections

```sql
-- List active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- List sessions with queries
SELECT pid, usename, application_name, query FROM pg_stat_activity 
WHERE datname = 'zscan_main';

-- Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'zscan_main' AND state = 'idle';
```

### Query Performance

```sql
-- Slow queries log
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Clear stats
SELECT pg_stat_statements_reset();
```

---

## TypeORM Entity Example

```typescript
// src/modules/patients/entities/patient.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('patients')
export class PatientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  fullName: string;

  @Column('date')
  dateOfBirth: Date;

  @Column('varchar', { length: 11, unique: true })  // Unique per tenant schema
  cpf: string;

  @Column('varchar', { length: 20 })
  phonePrimary: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid', { nullable: true })
  createdBy: string;

  @Column('uuid', { nullable: true })
  updatedBy: string;
}
```

---

## Verification Checklist

- [ ] `.env` contains `DB_HOST=db` (for Docker) or `localhost` (local)
- [ ] `docker compose build` completes without errors
- [ ] `docker compose up -d` starts all services
- [ ] `curl http://localhost:3000/health` returns 200
- [ ] Database migrations run automatically on first startup
- [ ] `docker compose logs api` shows no "Cannot connect" errors
- [ ] `docker compose exec db psql -U zscan -d zscan_main -c "\dt"` shows public tables
- [ ] Tenant schemas exist: `tenant_main`, etc.
- [ ] API Swagger docs available at `http://localhost:3000/api/docs`

---

## Next Steps

1. ✅ Verify connection with checklist above
2. ✅ Create second tenant for multi-tenant testing: [MULTITENANT_TESTING_GUIDE.md](MULTITENANT_TESTING_GUIDE.md)
3. ✅ Run API endpoints: [API endpoints documented in README.md](README.md#-api-endpoints)
4. ✅ Monitor performance: Use SQL queries in "Monitoring" section
5. ✅ Deploy to production: Apply security hardening and backup strategy

---

**Documentation Version**: 1.0  
**Last Updated**: 2024-04-03  
**Status**: ✅ Production Ready
