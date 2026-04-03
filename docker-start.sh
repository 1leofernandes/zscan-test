#!/bin/bash
# Docker Compose Startup Script for ZScan Multi-Tenant System

set -e

echo "🚀 ZScan Docker Compose Startup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${BLUE}📋 Checking Docker status...${NC}"
if ! docker ps > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if .env file exists
echo -e "${BLUE}📋 Checking environment configuration...${NC}"
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
  if [ ! -f .env.example ]; then
    echo -e "${RED}❌ .env.example not found. Cannot proceed.${NC}"
    exit 1
  fi
  cp .env.example .env
  echo -e "${GREEN}✅ .env file created${NC}"
else
  echo -e "${GREEN}✅ .env file found${NC}"
fi
echo ""

# Build images
echo -e "${BLUE}🔨 Building Docker images...${NC}"
docker compose build --no-cache \
  && echo -e "${GREEN}✅ Images built successfully${NC}" \
  || (echo -e "${RED}❌ Failed to build images${NC}" && exit 1)
echo ""

# Start services
echo -e "${BLUE}▶️  Starting services...${NC}"
docker compose up -d \
  && echo -e "${GREEN}✅ Services started${NC}" \
  || (echo -e "${RED}❌ Failed to start services${NC}" && exit 1)
echo ""

# Wait for database
echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  if docker exec zscan-db pg_isready -U zscan > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is ready${NC}"
    break
  fi
  echo "   Attempt $attempt/$max_attempts..."
  sleep 1
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo -e "${RED}❌ Database failed to start in time${NC}"
  exit 1
fi
echo ""

# Wait for API
echo -e "${BLUE}⏳ Waiting for API to be ready...${NC}"
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  if docker exec zscan-api node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode === 200) process.exit(0); else process.exit(1)})" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is ready${NC}"
    break
  fi
  echo "   Attempt $attempt/$max_attempts..."
  sleep 2
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo -e "${YELLOW}⚠️  API is taking longer than expected. Continue waiting or check logs.${NC}"
  echo -e "   Run: ${BLUE}docker compose logs api${NC}"
fi
echo ""

# Wait for Web
echo -e "${BLUE}⏳ Waiting for Frontend to be ready...${NC}"
max_attempts=20
attempt=1
while [ $attempt -le $max_attempts ]; do
  if docker exec zscan-web node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode === 200) process.exit(0); else process.exit(1)})" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is ready${NC}"
    break
  fi
  echo "   Attempt $attempt/$max_attempts..."
  sleep 2
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo -e "${YELLOW}⚠️  Frontend is taking longer than expected. Continue waiting or check logs.${NC}"
  echo -e "   Run: ${BLUE}docker compose logs web${NC}"
fi
echo ""

# Display service information
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ZScan is now running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📍 Services:"
echo "  🌐 Frontend:  ${BLUE}http://localhost:3001${NC}"
echo "  🔌 API:       ${BLUE}http://localhost:3000${NC}"
echo "  📚 Swagger:   ${BLUE}http://localhost:3000/api/docs${NC}"
echo "  🗄️  Database:  ${BLUE}localhost:5432${NC}"
echo "  ⚡ Redis:     ${BLUE}localhost:6379${NC}"
echo ""

echo "👤 Test Credentials:"
echo "  Email:    ${YELLOW}leonardoff24@gmail.com${NC}"
echo "  Password: ${YELLOW}123456789${NC}"
echo ""

echo "📋 Useful Commands:"
echo "  View logs:        ${BLUE}docker compose logs -f${NC}"
echo "  Logs (API):       ${BLUE}docker compose logs -f api${NC}"
echo "  Logs (Frontend):  ${BLUE}docker compose logs -f web${NC}"
echo "  Logs (Database):  ${BLUE}docker compose logs -f db${NC}"
echo "  Stop services:    ${BLUE}docker compose down${NC}"
echo "  Restart services: ${BLUE}docker compose restart${NC}"
echo "  Run bash:         ${BLUE}docker compose exec api bash${NC}"
echo ""

echo "🧪 Multi-Tenant Testing:"
echo "  Setup guide:  ${BLUE}cat MULTITENANT_TESTING_GUIDE.md${NC}"
echo "  Quick test:   ${BLUE}bash QUICK_TEST_COMMANDS.sh${NC}"
echo ""

echo -e "${GREEN}Happy coding! 🎉${NC}"
