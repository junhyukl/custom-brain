#!/usr/bin/env bash
#
# 프로젝트 루트에서 실행. 의존성 설치·빌드·brain-data 초기화.
# 사용: ./deploy/setup-app.sh (프로젝트 루트가 현재 디렉터리이거나 인자로 경로 지정)
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -n "$1" ]; then
  ROOT="$(cd "$1" && pwd)"
else
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

cd "$ROOT"
echo "[setup-app] 프로젝트 루트: $ROOT"

if [ ! -f "package.json" ]; then
  echo "오류: package.json 없음. custom-brain 프로젝트 루트에서 실행하세요."
  exit 1
fi

# pnpm 설치 확인
if ! command -v pnpm &>/dev/null; then
  echo "오류: pnpm 없음. deploy/install-ubuntu.sh 를 먼저 실행하세요."
  exit 1
fi

echo "[setup-app] 의존성 설치..."
pnpm install

echo "[setup-app] 프론트엔드 의존성 및 빌드..."
pnpm -C frontend install
pnpm run build:ui

echo "[setup-app] 백엔드 빌드..."
pnpm run build

# .env
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "[setup-app] .env 생성됨 (.env.example 복사). 필요 시 편집하세요."
  else
    echo "[setup-app] .env 없음. 직접 생성 후 PORT, MONGO_URL, QDRANT_URL 등 설정하세요."
  fi
else
  echo "[setup-app] .env 이미 존재"
fi

# brain-data 디렉터리
for dir in brain-data/personal/notes brain-data/personal/documents brain-data/personal/projects brain-data/personal/photos brain-data/personal/voice \
           brain-data/family/photos brain-data/family/documents brain-data/family/history brain-data/family/faces_src \
           brain-data/upload brain-data/upload/processed; do
  if [ ! -d "$ROOT/$dir" ]; then
    mkdir -p "$ROOT/$dir"
    echo "[setup-app] 생성: $dir"
  fi
done

echo ""
echo "설정 완료. 다음:"
echo "  1) .env 수정 (MONGO_URL, QDRANT_URL, PORT 등)"
echo "  2) Docker 기동: docker compose up -d  (또는 docker compose -f docker/docker-compose.yml up -d)"
echo "  3) (선택) Ollama: ollama serve && ollama pull mistral:7b-instruct && ollama pull nomic-embed-text && ollama pull llava"
echo "  4) API 실행: pnpm run start:prod"
echo "  5) UI 정적 파일: frontend/dist 를 nginx 등으로 서빙 (예: root /opt/custom-brain/frontend/dist;)"
exit 0
