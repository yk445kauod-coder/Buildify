#!/bin/bash
# Autotronic Deployment Script
# Deploy Autotronic to production server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="autotronic"
COMPOSE_FILE="docker-compose.yml"
IMAGE_NAME="autotronic/autotronic"
TAG="${1:-latest}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Autotronic Deployment Script${NC}"
echo -e "${BLUE}  By Egytronic${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Use docker compose command (Docker Compose V2)
COMPOSE="docker compose"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if .env file exists
if [ ! -f .env ]; then
    log_warn ".env file not found. Creating from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        log_warn "Please edit .env and set secure passwords!"
    else
        log_warn "Creating basic .env file..."
        cat > .env << EOF
# Autotronic Environment Configuration
NODE_ENV=production
PORT=3000

# Security (CHANGE THESE!)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Database
POSTGRES_USER=autotronic
POSTGRES_PASSWORD=$(openssl rand -base64 16)
POSTGRES_DB=autotronic

# Redis
REDIS_PASSWORD=$(openssl rand -base64 16)
EOF
        log_warn "Please edit .env and set secure values!"
    fi
fi

# Create necessary directories
log_info "Creating necessary directories..."
mkdir -p data logs nginx/ssl

# Pull latest code
log_info "Updating code..."
if [ -d .git ]; then
    git pull origin main
fi

# Build Docker image
log_info "Building Docker image (${IMAGE_NAME}:${TAG})..."
docker build -t ${IMAGE_NAME}:${TAG} .

# Stop existing containers
log_info "Stopping existing containers..."
docker compose down || docker-compose down

# Start services
log_info "Starting services..."
docker compose up -d || docker-compose up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 10

# Check service status
log_info "Checking service status..."
docker compose ps || docker-compose ps

# Show logs
log_info "Recent logs:"
docker compose logs --tail=20 || docker-compose logs --tail=20

# Done
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
log_info "Autotronic is running at http://localhost:3000"
log_info "API Health: http://localhost:3000/api/health"
log_info ""
log_info "Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop: docker compose down"
echo "  - Restart: docker compose restart"
echo ""
