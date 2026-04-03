# Docker Compose Startup Script for ZScan - Windows PowerShell
# Usage: .\docker-start.ps1

param(
    [switch]$Rebuild = $false,
    [switch]$Down = $false,
    [switch]$Logs = $false
)

# Color codes
$Colors = @{
    RED = 'Red'
    GREEN = 'Green'
    YELLOW = 'Yellow'
    BLUE = 'Cyan'
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor $Colors.BLUE
    Write-Host $Message -ForegroundColor $Colors.BLUE
    Write-Host "========================================" -ForegroundColor $Colors.BLUE
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.GREEN
}

function Write-Error_Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.RED
}

function Write-Warning_Custom {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.YELLOW
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.BLUE
}

Write-Header "ZScan Docker Compose Startup (Windows)"

# Check if stopping services
if ($Down) {
    Write-Info "Stopping services..."
    docker compose down
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services stopped"
    } else {
        Write-Error_Custom "Failed to stop services"
        exit 1
    }
    exit 0
}

# Check if showing logs
if ($Logs) {
    Write-Info "Showing logs..."
    docker compose logs -f
    exit 0
}

# Check Docker
Write-Host ""
Write-Info "Checking Docker status..."
$dockerStatus = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error_Custom "Docker is not running. Please start Docker Desktop."
    exit 1
}
Write-Success "Docker is running"

# Check .env file
Write-Host ""
Write-Info "Checking environment configuration..."
if (!(Test-Path ".env")) {
    Write-Warning_Custom ".env file not found. Creating from .env.example..."
    if (!(Test-Path ".env.example")) {
        Write-Error_Custom ".env.example not found. Cannot proceed."
        exit 1
    }
    Copy-Item ".env.example" ".env"
    Write-Success ".env file created"
} else {
    Write-Success ".env file found"
}

# Build images
Write-Host ""
Write-Info "Building Docker images..."
if ($Rebuild) {
    docker compose build --no-cache
} else {
    docker compose build
}

if ($LASTEXITCODE -eq 0) {
    Write-Success "Images built successfully"
} else {
    Write-Error_Custom "Failed to build images"
    exit 1
}

# Start services
Write-Host ""
Write-Info "Starting services..."
docker compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Success "Services started"
} else {
    Write-Error_Custom "Failed to start services"
    exit 1
}

# Wait for database
Write-Host ""
Write-Info "Waiting for database to be ready..."
$maxAttempts = 30
$attempt = 1
while ($attempt -le $maxAttempts) {
    $dbReady = docker exec zscan-db pg_isready -U zscan 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database is ready"
        break
    }
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor $Colors.BLUE
    Start-Sleep -Seconds 1
    $attempt++
}

if ($attempt -gt $maxAttempts) {
    Write-Error_Custom "Database failed to start in time"
    exit 1
}

# Wait for API
Write-Host ""
Write-Info "Waiting for API to be ready..."
$maxAttempts = 30
$attempt = 1
while ($attempt -le $maxAttempts) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -ErrorAction SilentlyContinue
        if ($null -ne $response) {
            Write-Success "API is ready"
            break
        }
    } catch {
        # Silent catch, will retry
    }
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor $Colors.BLUE
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -gt $maxAttempts) {
    Write-Warning_Custom "API is taking longer than expected. Check logs with: docker compose logs api"
}

# Wait for Web
Write-Host ""
Write-Info "Waiting for Frontend to be ready..."
$maxAttempts = 20
$attempt = 1
while ($attempt -le $maxAttempts) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001" -ErrorAction SilentlyContinue
        if ($null -ne $response) {
            Write-Success "Frontend is ready"
            break
        }
    } catch {
        # Silent catch, will retry
    }
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor $Colors.BLUE
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -gt $maxAttempts) {
    Write-Warning_Custom "Frontend is taking longer than expected. Check logs with: docker compose logs web"
}

# Display summary
Write-Host ""
Write-Host "========================================" -ForegroundColor $Colors.GREEN
Write-Host "ZScan is now running!" -ForegroundColor $Colors.GREEN
Write-Host "========================================" -ForegroundColor $Colors.GREEN
Write-Host ""

Write-Host "Services:" -ForegroundColor $Colors.BLUE
Write-Host "  Frontend:  http://localhost:3001" -ForegroundColor $Colors.YELLOW
Write-Host "  API:       http://localhost:3000" -ForegroundColor $Colors.YELLOW
Write-Host "  Swagger:   http://localhost:3000/api/docs" -ForegroundColor $Colors.YELLOW
Write-Host "  Database:  localhost:5432" -ForegroundColor $Colors.YELLOW
Write-Host "  Redis:     localhost:6379" -ForegroundColor $Colors.YELLOW
Write-Host ""


Write-Host "Useful Commands:" -ForegroundColor $Colors.BLUE
Write-Host "  View logs:        docker compose logs -f" -ForegroundColor $Colors.YELLOW
Write-Host "  Logs (API):       docker compose logs -f api" -ForegroundColor $Colors.YELLOW
Write-Host "  Logs (Frontend):  docker compose logs -f web" -ForegroundColor $Colors.YELLOW
Write-Host "  Stop services:    docker compose down" -ForegroundColor $Colors.YELLOW
Write-Host "  Restart services: docker compose restart" -ForegroundColor $Colors.YELLOW
Write-Host ""

Write-Host "Happy coding!" -ForegroundColor $Colors.GREEN