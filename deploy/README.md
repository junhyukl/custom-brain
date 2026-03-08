# Ubuntu Linux 배포

Ubuntu에서 custom-brain을 설치·실행하기 위한 스크립트와 설정입니다.

---

## 요구 사항

- Ubuntu 22.04 LTS (또는 20.04)
- sudo 권한

---

## 1. 시스템 의존성 설치

프로젝트를 복사하기 **전에** 한 번만 실행합니다.

```bash
# 저장소 클론 또는 압축 해제 후 deploy 폴더로 이동
cd /path/to/custom-brain
sudo chmod +x deploy/*.sh
sudo ./deploy/install-ubuntu.sh
```

**Ollama까지 함께 설치** (LLM·임베딩·Vision용):

```bash
sudo ./deploy/install-ubuntu.sh --with-ollama
```

설치되는 항목:

| 항목 | 용도 |
|------|------|
| Docker | Qdrant, MongoDB 컨테이너 실행 |
| Node.js 20 | Nest API, 빌드 |
| pnpm | 패키지 매니저 |
| Ollama (선택) | 로컬 LLM·임베딩·사진 설명 |

---

## 2. 프로젝트 배치

- **클론**: `git clone <repo> /opt/custom-brain && cd /opt/custom-brain`
- **또는** 압축/rsync 등으로 `/opt/custom-brain`에 복사

---

## 3. 앱 설정 및 빌드

프로젝트 **루트**에서 실행합니다.

```bash
cd /opt/custom-brain
./deploy/setup-app.sh
```

동작 요약:

- `pnpm install` (백엔드·프론트엔드)
- `pnpm run build` (Nest)
- `pnpm run build:ui` (React → `frontend/dist`)
- `.env` 없으면 `.env.example` 복사
- `brain-data` 하위 디렉터리 생성

---

## 4. 환경 변수

`.env`를 편집합니다.

```bash
nano .env
```

필수 예시:

- `PORT=3001`
- `MONGO_URL=mongodb://localhost:27017`
- `QDRANT_URL=http://localhost:6333`
- `MONGO_DB_NAME=custom_brain`
- `OLLAMA_URL=http://localhost:11434` (Ollama 사용 시)

프로덕션에서는 `SKIP_AUTH`를 두지 말고, `CORS_ORIGIN`에 실제 UI 도메인을 넣습니다.

---

## 5. Docker 기동 (Qdrant, MongoDB)

프로젝트 루트에서:

```bash
docker compose up -d
```

또는 `docker/` 쪽 compose 사용 시:

```bash
docker compose -f docker/docker-compose.yml up -d qdrant mongo
```

---

## 6. Ollama (선택)

LLM·임베딩·Vision을 쓰는 경우:

```bash
ollama serve
ollama pull mistral:7b-instruct
ollama pull nomic-embed-text
ollama pull llava
```

---

## 7. API 실행

**수동 실행:**

```bash
cd /opt/custom-brain
pnpm run start:prod
```

**systemd로 상시 실행:**

```bash
# 경로를 실제 설치 경로로 변경 (예: /opt/custom-brain)
sudo cp deploy/custom-brain.service /etc/systemd/system/
sudo sed -i 's|/opt/custom-brain|/opt/custom-brain|g' /etc/systemd/system/custom-brain.service
# 실제 경로가 다르면: sudo nano /etc/systemd/system/custom-brain.service 에서 WorkingDirectory, EnvironmentFile 수정

sudo systemctl daemon-reload
sudo systemctl enable custom-brain
sudo systemctl start custom-brain
sudo systemctl status custom-brain
```

API는 기본적으로 `http://localhost:3001`에서 동작합니다.

---

## 8. 웹 UI 서빙

`frontend/dist`를 웹 서버로 서빙합니다.

**nginx 예시:**

```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /opt/custom-brain/frontend/dist;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
  location /auth { proxy_pass http://127.0.0.1:3001; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
  location /brain { proxy_pass http://127.0.0.1:3001; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
}
```

API와 동일 호스트에서 UI만 분리하려면 `location /auth`와 `location /brain`으로 Nest(3001)에 프록시하면 됩니다.

---

## 9. 한 번에 실행 (요약)

```bash
sudo ./deploy/install-ubuntu.sh --with-ollama
cd /opt/custom-brain
./deploy/setup-app.sh
# .env 수정
docker compose up -d
# (별도 터미널) ollama serve && ollama pull mistral:7b-instruct && ollama pull nomic-embed-text && ollama pull llava
pnpm run start:prod
```

systemd를 쓰면 마지막 `pnpm run start:prod` 대신 위 7번처럼 서비스 등록 후 `systemctl start custom-brain`으로 실행하면 됩니다.
