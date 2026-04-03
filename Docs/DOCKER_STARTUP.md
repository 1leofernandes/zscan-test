# Docker Startup Guide

## Quick Start

### On Linux/macOS:
```bash
chmod +x ./start.sh
./start.sh
```

### On Windows (PowerShell):
```powershell
docker-compose -f .docker/docker-compose.yml up -d
```

## Detailed Setup

### Prerequisites
- Docker Desktop installed and running
- 4GB RAM minimum (8GB recommended for comfortable development)
- Ports 3000, 3001, 5432, 6379 available

### Step 1: Environment Configuration
Create a `.env` file in the project root (or copy from .env.example):

```bash
cp .env.example .env
```

Configure the following variables as needed:
- `POSTGRES_PASSWORD` - Database password (change for production)
- `REDIS_PASSWORD` - Redis password (change for production)
- `JWT_SECRET` - JWT signing secret (must be strong for production)
- `NODE_ENV` - Set to `development` or `production`

### Step 2: Start Services

```bash
# Start all services in background
docker-compose -f .docker/docker-compose.yml up -d

# View logs in real-time
docker-compose -f .docker/docker-compose.yml logs -f

# Stop services
docker-compose -f .docker/docker-compose.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f .docker/docker-compose.yml down -v
```

### Step 3: Verify Services

Wait 30-40 seconds for all services to start, then check their status:

```bash
# Check service status
docker-compose -f .docker/docker-compose.yml ps

# Test PostgreSQL connection
docker-compose -f .docker/docker-compose.yml exec postgres pg_isready -U zscan

# Test Redis connection
docker-compose -f .docker/docker-compose.yml exec redis redis-cli ping

# Check API health
curl http://localhost:3000/health

# Check Frontend
curl http://localhost:3001
```

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3001 | Web application |
| API | http://localhost:3000 | REST API endpoints |
| PostgreSQL | localhost:5432 | Database (internal) |
| Redis | localhost:6379 | Cache (internal) |

## Common Commands

### View Logs
```bash
# All services
docker-compose -f .docker/docker-compose.yml logs -f

# Specific service
docker-compose -f .docker/docker-compose.yml logs -f api
docker-compose -f .docker/docker-compose.yml logs -f web
docker-compose -f .docker/docker-compose.yml logs -f postgres
docker-compose -f .docker/docker-compose.yml logs -f redis
```

### Execute Commands in Containers
```bash
# Run API CLI commands in running container
docker-compose -f .docker/docker-compose.yml exec api npm run cli:help

# Access PostgreSQL shell
docker-compose -f .docker/docker-compose.yml exec postgres psql -U zscan -d zscan_dev

# Access Redis CLI
docker-compose -f .docker/docker-compose.yml exec redis redis-cli
```

### Database Management
```bash
# Create a backup
docker-compose -f .docker/docker-compose.yml exec postgres pg_dump -U zscan zscan_dev > backup.sql

# Restore from backup
docker-compose -f .docker/docker-compose.yml exec -T postgres psql -U zscan zscan_dev < backup.sql

# Reset database (deletes all data)
docker-compose -f .docker/docker-compose.yml down -v
docker-compose -f .docker/docker-compose.yml up -d
```

## Troubleshooting

### Services Won't Start
1. Check Docker is running: `docker ps`
2. Check for port conflicts: `netstat -tulpn | grep LISTEN` (Linux/macOS)
3. View detailed logs: `docker-compose -f .docker/docker-compose.yml logs api`
4. Rebuild images: `docker-compose -f .docker/docker-compose.yml build --no-cache`

### Database Connection Errors
```bash
# Check database is ready
docker-compose -f .docker/docker-compose.yml logs postgres

# Verify PostgreSQL is accepting connections
docker-compose -f .docker/docker-compose.yml exec postgres pg_isready -U zscan

# Reset database completely
docker-compose -f .docker/docker-compose.yml down -v
docker-compose -f .docker/docker-compose.yml up -d
```

### Frontend Not Loading
1. Check web container is running: `docker-compose -f .docker/docker-compose.yml ps web`
2. Check build completed: `docker-compose -f .docker/docker-compose.yml logs web`
3. Check API connectivity: `curl http://localhost:3000/health`
4. Check frontend environment: `docker-compose -f .docker/docker-compose.yml exec web env | grep NEXT`

### Memory Issues
Increase Docker Desktop memory allocation:
- Docker Desktop Settings → Resources → Memory (set to 6-8GB)
- May need to rebuild images after increasing memory

## Health Check Monitoring

Each service has a health check configured:

```bash
# Monitor health status
watch -n 1 'docker-compose -f .docker/docker-compose.yml ps'

# Or check individual service health
docker inspect --format='{{.State.Health.Status}}' zscan_postgres_1
```

## Production Considerations

Before deploying to production:

1. **Security**
   - Change all default passwords in `.env`
   - Use strong `JWT_SECRET` (minimum 32 characters)
   - Enable PostgreSQL SSL connections
   - Use Redis password authentication
   - Configure firewall rules

2. **Performance**
   - Set `NODE_ENV=production` in API
   - Enable Redis persistence (`appendonly yes`)
   - Configure PostgreSQL connection pooling
   - Add load balancing for multiple API instances

3. **Monitoring**
   - Set up logging aggregation (ELK stack, etc.)
   - Configure health check alerts
   - Monitor resource usage
   - Set up backup automation

4. **Scaling**
   - Use Docker Swarm or Kubernetes for orchestration
   - Add reverse proxy (nginx) for API/frontend
   - Implement horizontal scaling for API instances
   - Use managed database services for production

## Support

For issues or questions:
- Check logs: `docker-compose -f .docker/docker-compose.yml logs`
- Review Docker documentation: https://docs.docker.com/
- Check ZScan documentation: See README.md

