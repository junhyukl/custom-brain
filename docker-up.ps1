# Qdrant/Mongo: 기존 Docker 컨테이너가 있으면 사용, 없으면 새로 생성
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Test-PortInUse {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Test-ContainerRunning {
    param([string]$Name)
    $c = docker ps --filter "name=^${Name}$" --format "{{.Names}}" 2>$null
    return ($c -eq $Name)
}

# Qdrant: 컨테이너가 이미 떠 있거나 6333 사용 중이면 스킵, 아니면 생성
if (Test-ContainerRunning "custom-brain-qdrant") {
    Write-Host "Qdrant: 기존 컨테이너 사용 중" -ForegroundColor Green
} elseif (Test-PortInUse 6333) {
    Write-Host "Qdrant: 포트 6333 사용 중 - 기존 서비스 사용" -ForegroundColor Green
} else {
    Write-Host "Qdrant: 컨테이너 생성 중..." -ForegroundColor Yellow
    docker compose -f docker/docker-compose.yml up -d qdrant
}

# Mongo: 컨테이너가 이미 떠 있거나 27017 사용 중이면 스킵, 아니면 생성
if (Test-ContainerRunning "custom-brain-mongo") {
    Write-Host "Mongo: 기존 컨테이너 사용 중" -ForegroundColor Green
} elseif (Test-PortInUse 27017) {
    Write-Host "Mongo: 포트 27017 사용 중 - 기존 서비스 사용" -ForegroundColor Green
} else {
    Write-Host "Mongo: 컨테이너 생성 중..." -ForegroundColor Yellow
    docker compose -f docker/docker-compose.yml up -d mongo
}

Write-Host "`n완료. Qdrant: localhost:6333 / Mongo: localhost:27017" -ForegroundColor Cyan
