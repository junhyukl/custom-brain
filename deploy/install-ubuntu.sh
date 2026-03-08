#!/usr/bin/env bash
#
# Ubuntu Linux — 시스템 의존성 설치 (Docker, Node.js 20, pnpm, 선택: Ollama)
# 사용: sudo ./install-ubuntu.sh [--with-ollama]
# 프로젝트 복사/클론은 별도. 설치 후 deploy/setup-app.sh 로 앱 설정.
#
set -e

WITH_OLLAMA=false
for arg in "$@"; do
  if [ "$arg" = "--with-ollama" ]; then
    WITH_OLLAMA=true
    break
  fi
done

if [ "$(id -u)" -ne 0 ]; then
  echo "Root 권한이 필요합니다. sudo ./install-ubuntu.sh [--with-ollama]"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl git ca-certificates gnupg

# Docker (Qdrant, MongoDB용)
if ! command -v docker &>/dev/null; then
  echo "[install] Docker 설치 중..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "[install] Docker 이미 설치됨"
fi

# Node.js 20 LTS
if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  echo "[install] Node.js 20 설치 중..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "[install] Node.js 이미 설치됨: $(node -v)"
fi

# pnpm
if ! command -v pnpm &>/dev/null; then
  echo "[install] pnpm 설치 중..."
  corepack enable 2>/dev/null || true
  npm install -g pnpm
else
  echo "[install] pnpm 이미 설치됨: $(pnpm -v)"
fi

# Ollama (선택)
if [ "$WITH_OLLAMA" = true ]; then
  if ! command -v ollama &>/dev/null; then
    echo "[install] Ollama 설치 중..."
    curl -fsSL https://ollama.com/install.sh | sh
  else
    echo "[install] Ollama 이미 설치됨"
  fi
else
  echo "[install] Ollama 미설치. 필요 시: sudo ./install-ubuntu.sh --with-ollama 또는 https://ollama.com"
fi

echo ""
echo "설치 완료. 다음 단계:"
echo "  1) 프로젝트를 서버에 복사/클론 (예: /opt/custom-brain)"
echo "  2) cd /opt/custom-brain && ./deploy/setup-app.sh"
echo "  3) .env 수정 후 Docker 기동: docker compose up -d"
echo "  4) API 실행: pnpm run start:prod 또는 systemd 사용 (deploy/README.md 참고)"
exit 0
