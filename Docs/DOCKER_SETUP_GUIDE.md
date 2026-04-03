# 🐳 Docker Setup & Startup Guide

This guide will help you get the ZScan multi-tenant system running with Docker.

## Prerequisites

- **Docker Desktop** installed and running
- **Docker Compose** (included with Docker Desktop)
- **.env file** configured with database credentials

## Quick Start (Recommended)

### Windows (PowerShell)

```powershell
# Make script executable (first time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Start all services with automatic health checks
.\docker-start.ps1

# With rebuild (no cache)
.\docker-start.ps1 -Rebuild

# View logs
.\docker-start.ps1 -Logs

# Stop services
.\docker-start.ps1 -Down
```

### macOS / Linux (Bash)

```bash
# Make script executable
chmod +x docker-start.sh

# Start all services
./docker-start.sh

# Stop services
docker compose down
```

## Manual Docker Commands

### 1. Build Images

```bash
# Build all services
docker compose build

# Build specific service
docker compose build api
docker compose build web

# Build with no cache
docker compose build --no-cache
```

### 2. Start Services

```bash
# Start all services in background
docker compose up -d

# Start with logs output
docker compose up

# Start specific service
docker compose up -d api
docker compose up -d web
```

### 3. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
docker compose logs -f redis

# Last 100 lines
docker compose logs -f --tail=100 api
```

### 4. Stop Services

```bash
# Stop services (keep volumes)
docker compose stop

# Stop and remove containers
docker compose down

# Remove everything including volumes
docker compose down -v
```

### 5. Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart api
docker compose restart web
```

## Service Details

### API Service
- **Port**: 3000 (internal) → 3000 (external)
- **Health Check**: `GET http://localhost:3000/health`
- **Swagger Docs**: `http://localhost:3000/api/docs`
- **Built from**: `./api/Dockerfile`
- **Command**: `npm run start:dev`

### Frontend Service
- **Port**: 3001 (internal) → 3001 (external)
- **Health Check**: `GET http://localhost:3001/`
- **Built from**: `./web/Dockerfile`
- **Command**: `npm run dev`

### Database Service
- **Port**: 5432 (internal) → 5432 (external)
- **Type**: PostgreSQL 15 Alpine
- **Health Check**: `pg_isready -U zscan`
- **Volume**: `postgres_data:/var/lib/postgresql/data`

### Redis Service
- **Port**: 6379 (internal) → 6379 (external)
- **Type**: Redis 7 Alpine
- **Health Check**: `redis-cli ping`
- **Volume**: `redis_data:/data`

## Environment Variables

### Database (.env)
```env
DB_HOST=db                 # Docker service name
DB_PORT=5432
DB_USER=zscan
DB_PASSWORD=zscan123
DB_NAME=zscan_main
```

### API (.env)
```env
NODE_ENV=development
API_PORT=3000
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRATION=3600s
REDIS_HOST=redis
REDIS_PORT=6379
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://api:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXTAUTH_SECRET=your-auth-secret
NEXTAUTH_URL=http://localhost:3001
```

## Network Configuration

All services are on the **zscan-network** bridge network.

### Internal Service Discovery
- `api:3000` - Backend service (from web container)
- `db:5432` - Database (from api container)
- `redis:6379` - Redis (from api container)

### External Access
- `localhost:3000` - API
- `localhost:3001` - Frontend
- `localhost:5432` - Database
- `localhost:6379` - Redis

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>

# Or stop all Docker containers
docker compose down
```

### Database Connection Refused

```bash
# Check if database is healthy
docker compose ps

# Check database logs
docker compose logs -f db

# Restart database
docker compose restart db

# Manually test connection
docker compose exec db psql -U zscan -d zscan_main -c "SELECT 1"
```

### API Fails to Start

```bash
# Check API logs
docker compose logs -f api

# Check if port is in use
netstat -an | grep 3000

# Ensure .env has correct values
cat .env | grep DB_

# Rebuild API
docker compose build --no-cache api
```

### Frontend Cannot Connect to API

```bash
# Check if API is accessible from web container
docker compose exec web curl http://api:3000/health

# Check if frontend is using correct API URL
docker compose exec web env | grep NEXT_PUBLIC_API

# Check CORS configuration in main.ts
```

### Build Fails

```bash
# Clean up everything
docker compose down -v
docker system prune -a

# Rebuild all
docker compose build --no-cache

# Start again
docker compose up -d
```

## Monitoring

### Check Container Status

```bash
# List all running containers
docker compose ps

# Show detailed information
docker compose ps -a

# Show size of containers
docker system df

# Show resource usage
docker stats
```

### Database Monitoring

```bash
# Connect to database
docker compose exec db psql -U zscan -d zscan_main

# Inside psql:
# List tables: \dt
# Show tenants: SELECT * FROM public.tenants;
# Show users: SELECT email, role FROM public.users;
# Exit: \q
```

### Check Volumes

```bash
# List all volumes
docker volume ls

# Inspect volume
docker volume inspect zscan_postgres_data
docker volume inspect zscan_redis_data

# Remove unused volumes
docker volume prune
```

## Production Deployment Notes

### Before Deploying:

1. **Change secrets in .env**:
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - NEXTAUTH_SECRET
   - REDIS_PASSWORD (set a real password)

2. **Set NODE_ENV=production** in .env

3. **Use production builds**: Remove `--watch` flags

4. **Enable HTTPS**: Update docker-compose.yml with reverse proxy (Nginx/Traefik)

5. **Database backups**: Configure automated PostgreSQL backups

6. **Health checks**: Verify all services have proper health checks

7. **Resource limits**: Add memory and CPU limits to docker-compose.yml

8. **Logging**: Configure centralized logging (ELK, Datadog, etc.)

## Docker Compose Reference

### Update a Single Service

```bash
# Change only API environment and restart
docker compose up -d api

# Or modify and rebuild
docker compose build api && docker compose up -d api
```

### Execute Commands in Container

```bash
# Run bash in API container
docker compose exec api sh

# Run npm command
docker compose exec api npm list

# Run psql in database
docker compose exec db psql -U zscan -d zscan_main
```

### Copy Files

```bash
# From container to host
docker compose cp zscan-api:/app/dist ./api-dist

# From host to container
docker compose cp .env zscan-api:/app/.env
```

## Health Checks

All services have health checks configured. To manually verify:

```bash
# API Health
curl http://localhost:3000/health

# Frontend (should return HTML)
curl http://localhost:3001 | head -20

# Database Connection
docker compose exec api npm run typeorm -- query "SELECT 1"

# Redis
docker compose exec redis redis-cli ping
# Expected: PONG
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "port already in use" | Another service on same port | Run `docker compose down` or change port in .env |
| "Connection refused" (API→DB) | Database not ready | Wait 15s or check `docker compose logs db` |
| "Cannot find module" | Dependencies not installed | Run `docker compose build --no-cache` |
| "CORS error" in frontend | API CORS configuration | Check main.ts `enableCors()` config |
| "Out of memory" | Container resource limits | Increase Docker Desktop memory settings |

## Performance Tips

1. **Use .dockerignore** to exclude unnecessary files
2. **Multi-stage builds** (done in Dockerfiles) reduce image size
3. **Volume mounts** for development (hot reload)
4. **Turn off telemetry** for Next.js in production
5. **Cache Docker layers** by ordering Dockerfile commands efficiently

## Next Steps

1. ✅ Run: `./docker-start.ps1` (Windows) or `./docker-start.sh` (Linux/Mac)
2. ✅ Wait for all services to be "healthy"
3. ✅ Open http://localhost:3001 in your browser
4. ✅ Login with test credentials
5. ✅ Follow multi-tenant testing: [MULTITENANT_TESTING_GUIDE.md](MULTITENANT_TESTING_GUIDE.md)

---

**For more help**: Check individual service logs with `docker compose logs -f <service>`
