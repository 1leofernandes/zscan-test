#!/bin/bash

# ZScan Docker Startup Script
# Initializes and starts the complete system

set -e

echo "🚀 Starting ZScan System..."

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

# Create .env file from .env.example if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env 2>/dev/null || echo "⚠️  .env.example not found, using defaults"
fi

# Build images
echo "🔨 Building Docker images..."
docker-compose -f .docker/docker-compose.yml build

# Start services
echo "🌐 Starting services..."
docker-compose -f .docker/docker-compose.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if PostgreSQL is ready
echo "📦 Checking PostgreSQL..."
docker-compose -f .docker/docker-compose.yml exec -T postgres pg_isready -U zscan || true

# Check if Redis is ready
echo "💾 Checking Redis..."
docker-compose -f .docker/docker-compose.yml exec -T redis redis-cli ping || true

# Show status
echo ""
echo "✅ System is starting up!"
echo ""
echo "📊 Service Status:"
docker-compose -f .docker/docker-compose.yml ps

echo ""
echo "🌐 Access the application:"
echo "  • Frontend: http://localhost:3001"
echo "  • API: http://localhost:3000"
echo "  • Database: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo "📝 View logs:"
echo "  docker-compose -f .docker/docker-compose.yml logs -f"
echo ""
