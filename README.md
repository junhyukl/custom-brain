# custom-brain

NestJS 기반 **개인화 AI 브레인** API. 메모리 검색·저장, RAG, 자동 메모리 평가를 지원하며, 사진/문서 업로드부터 대량 수집·가족 그래프·Self-Learning까지 하나의 브레인으로 통합합니다.

---

## 주요 기능

| 영역 | 기능 |
|------|------|
| **채팅·질의** | `POST /brain/chat`, `POST /brain/ask` — RAG + 자동 메모리 평가(Important? → store/ignore) |
| **메모리·검색** | 벡터 검색, 메모리/사진/문서 검색, 타임라인 (Qdrant + MongoDB) |
| **업로드** | 사진(JPG/PNG/WebP), 문서(PDF/DOCX/TXT/MD), **음성**(MP3/WAV 등 → Whisper STT → 메모리) → 저장·추출·임베딩·메모리 자동 반영 |
| **대량 수집** | 폴더 스캔 → 얼굴 인식·Vision·임베딩 → `ingest-photos` / `ingest-all` / `ingest-all-parallel` |
| **가족** | 가족 트리·구성원 API, (선택) 얼굴 인식 → Family Graph |
| **v3 Self-Learning** | `POST /brain/organize` — 클러스터·타임라인·지식 그래프·요약. 매일 새벽 cron |
| **에이전트·UI** | OpenClaw 스킬, `run-agent` 예제, 웹 UI(업로드·검색·Timeline·Family Graph) |

- **로컬 우선**: Ollama + (선택) Qdrant·MongoDB. 데이터를 외부 클라우드에 넘기지 않고 셀프호스트 가능.
- **아키텍처**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (통합), [docs/README.md](docs/README.md) (문서 인덱스)

---

## 스택

- **NestJS** (Node.js) — 백엔드 API
- **Ollama** — 로컬 LLM (기본 `mistral:7b-instruct`), Vision, Embedding
- **Qdrant** — 벡터 저장소 (메모리·사진 검색)
- **MongoDB** — 메모리·가족 메타데이터·타임라인
- **(선택)** Python **ai-service** (8000) — Vision·Embedding·v3 cluster/summarize/timeline
- **(선택)** Python **face-service** (8001) — InsightFace 얼굴 인식
- **(선택)** **Neo4j** — v3 지식 그래프

---

## 시작하기

### 1. 의존성

```bash
pnpm install
```

(pnpm 미설치: [pnpm 설치](https://pnpm.io/installation). Corepack 사용 시 `corepack enable` 후 `corepack prepare pnpm@9.15.0 --activate`)

### 2. Ollama (필수)

```bash
ollama serve
ollama pull mistral:7b-instruct
ollama pull nomic-embed-text    # 벡터 검색
ollama pull llava               # 사진 설명 (업로드·수집 시)
```

Ollama 0.3.4 이상 권장 (임베딩 API `/api/embed`).

### 3. Qdrant + MongoDB (메모리·타임라인·가족 사용 시)

```powershell
# Windows
.\docker-up.ps1
```

```bash
# 또는
docker compose -f docker/docker-compose.yml up -d
```

- Qdrant: `http://localhost:6333`
- MongoDB: `mongodb://localhost:27017`
- 연결 확인: `pnpm run test:docker`

### 4. 실행

```bash
pnpm run start:dev
```

서버: **http://localhost:3001**

**한 번에 실행** (Docker + Nest + ai-service + face-service + UI):

```bash
pnpm run start:all
```

- Nest 3001, ai 8000, face 8001, UI 5173. ai/face는 각 폴더에서 `venv` + `pip install -r requirements.txt` 최초 1회 필요.

---

## 기능 상세

### 1. 채팅·질의

| 용도 | Method | Path | Body |
|------|--------|------|------|
| 한 턴 채팅 (RAG + 자동 메모리) | POST | `/brain/chat` | `{ "message": "..." }` |
| 질의 (검색 → LLM 답변 → 자동 메모리) | POST | `/brain/ask` | `{ "question": "..." }` |
| 세션 대화 목록 | GET | `/brain/memory` | - |

```bash
curl -X POST http://localhost:3001/brain/chat -H "Content-Type: application/json" -d "{\"message\":\"오늘 점심 뭐 먹었지?\"}"
curl -X POST http://localhost:3001/brain/ask -H "Content-Type: application/json" -d "{\"question\":\"우리 가족 2015년 여행 어디 갔어?\"}"
```

### 2. 메모리·검색·타임라인

| 용도 | Method | Path | Query / Body |
|------|--------|------|--------------|
| 메모리 저장 | POST | `/brain/memory` | `{ "content", "scope?", "type?", "metadata?" }` |
| 벡터 검색 | GET | `/brain/memory/search` | `?q=검색어&limit=10&scope=personal|family` |
| 최근 메모리 | GET | `/brain/memory/recall` | `?limit=50` |
| 사진 검색 | GET | `/brain/photos/search` | `?q=검색어&limit=10` |
| 문서 검색 | GET | `/brain/documents/search` | `?q=검색어&limit=10` |
| 타임라인 | GET | `/brain/timeline` | `?scope=personal|family&limit=100` |

### 3. 파일 업로드

| 용도 | Method | Path | 설명 |
|------|--------|------|------|
| 사진 업로드 | POST | `/brain/upload/photo` | multipart `file` — JPG/PNG/WebP. EXIF·Vision·Embedding·Qdrant·Mongo |
| 문서 업로드 | POST | `/brain/upload/document` | multipart `file` — **PDF/DOCX/TXT/MD**. 텍스트 추출·Embedding·Qdrant·Mongo |
| **음성 업로드** | POST | `/brain/upload/voice` | multipart `file` + 선택 `speaker`. **MP3/WAV/M4A 등** → ai-service Whisper STT → 텍스트 메모리 저장. `AI_SERVICE_URL` 필요. |

- 웹 UI: `pnpm run dev:ui` → http://localhost:5173 에서 드래그 앤 드롭 업로드·검색·Timeline·Family Graph.

**배치 업로드 (폴더)** — UI 일괄 업로드와 동일한 API로 처리:

1. `brain-data/upload` 폴더에 사진(JPG/PNG/WebP)·문서(PDF/DOCX/TXT/MD) 파일을 복사.
2. **자동**: 서버 실행 시 **3분마다** 해당 폴더를 스캔해 자동 처리 후 `upload/processed/` 로 이동.
3. **수동**: `pnpm run batch-upload` 로 즉시 1회 실행 (서버 실행 중).

환경 변수: `UPLOAD_FOLDER`(기본 `brain-data/upload`), `BRAIN_API_URL`(수동 스크립트용, 기본 `http://localhost:3001`).

### 4. 대량 수집 (Ingestion)

| 명령 | 설명 |
|------|------|
| `pnpm run build-face-db` | `brain-data/family/faces_src/` → `faces.json` (인물당 사진 1장 넣은 뒤 실행) |
| `pnpm run ingest-photos` | personal + family 사진 스캔 → 얼굴·Vision·임베딩·Qdrant·Memory |
| `pnpm run ingest-all` | 사진 + 문서(PDF/DOCX/TXT/MD) 통합 스캔 → 벡터화·Memory |
| `pnpm run ingest-all-parallel` | 병렬 수집 (기본 10 workers, `INGEST_WORKERS=20` 등) |
| `pnpm run build-timeline` | 메모리 연도별 타임라인 통계 출력 |

**폴더 구조**: `brain-data/personal/` (notes, documents, projects, photos), `brain-data/family/` (photos, documents, history, faces_src). 문서: PDF/DOCX/TXT/MD. 사진: JPG/PNG/WebP.

### 5. 가족 트리

| 용도 | Method | Path | Body |
|------|--------|------|------|
| 트리 조회 | GET | `/brain/family/tree` | - |
| 구성원 추가 | POST | `/brain/family/persons` | `{ "name", "relation", "birthDate?", "description?", "parentIds?" }` |

`relation` 예: `father`, `mother`, `grandfather`, `grandmother`, `child`, `spouse`, `sibling`.

### 6. v3 Self-Learning

| 용도 | Method | Path | 설명 |
|------|--------|------|------|
| 정리 1회 실행 | POST | `/brain/organize` | 클러스터·타임라인·지식 그래프·요약 (AI_SERVICE_URL, NEO4J_URI 설정 시) |

- 매일 03:00 cron으로 `clusterMemories`, `generateSummaries`, `updateKnowledgeGraph` 자동 실행.

### 7. 에이전트·웹 UI

- **에이전트 예제**: `pnpm run run-agent` — 질문 → searchMemory/searchPhotos/searchDocuments/timeline/familyTree → Ollama 답변.
- **OpenClaw**: `docs/openclaw/custom-brain/SKILL.md` 의 Agent Tools 테이블로 동일 엔드포인트 도구 등록.
- **웹 UI**: `pnpm run dev:ui` → 업로드·검색·Timeline·Family Graph (React + Tailwind + react-force-graph-2d).

---

## API 요약

| Method | Path | Body / Query | 설명 |
|--------|------|--------------|------|
| GET | `/` | - | Root (간단 응답) |
| GET | `/health` | - | **헬스 체크** — Mongo·Qdrant 연결 확인. 200=정상, 503=일부 비가용 |
| GET | `/test` | - | 테스트 러너 UI |
| POST | `/test/run` | - | 테스트 실행 (pnpm run test) |
| GET | `/brain/memory` | - | 세션 대화 목록 |
| POST | `/brain/chat` | `{ "message" }` | 채팅 (RAG + 메모리 저장) |
| POST | `/brain/ask` | `{ "question" }` | 질의 (검색 → LLM → 메모리 저장) |
| POST | `/brain/memory` | `{ "content", "scope?", "type?", "metadata?" }` | 메모리 저장 |
| GET | `/brain/memory/search` | `?q=&limit=&scope=` | 벡터 검색 |
| GET | `/brain/memory/recall` | `?limit=` | 최근 메모리 |
| GET | `/brain/photos/search` | `?q=&limit=` | 사진 검색 |
| GET | `/brain/documents/search` | `?q=&limit=` | 문서 검색 |
| GET | `/brain/timeline` | `?scope=&limit=` | 타임라인 |
| GET | `/brain/family/tree` | - | 가족 트리 |
| POST | `/brain/family/persons` | `{ "name", "relation", ... }` | 가족 구성원 추가 |
| POST | `/brain/photo/analyze` | `{ "image": "base64...", "date?", "people?" }` | 사진 분석 후 메모리 저장 |
| POST | `/brain/upload/photo` | multipart `file` | 사진 업로드 |
| POST | `/brain/upload/document` | multipart `file` | 문서 업로드 (PDF/DOCX/TXT/MD) |
| POST | `/brain/upload/voice` | multipart `file`, body `speaker?` | 음성 업로드 → Whisper STT → 메모리 |
| POST | `/brain/organize` | - | v3 정리 1회 실행 |

---

## 스크립트 요약

| 명령 | 설명 |
|------|------|
| `pnpm run start:dev` | Nest 개발 서버만 (watch) |
| `pnpm run start:prod` | 프로덕션 서버 |
| `pnpm run start:docker` | Docker: Qdrant + Mongo up |
| `pnpm run start:all` | Docker + Nest + ai + face + UI 동시 실행 |
| `pnpm run dev` | **개발용** — start:all과 동일 (Docker + Nest + ai + face + UI) |
| `pnpm run ingest-photos` | 사진 스캔 → 얼굴·Vision·메모리 |
| `pnpm run ingest-all` | 사진 + 문서 통합 스캔 |
| `pnpm run ingest-all-parallel` | 병렬 수집 |
| `pnpm run batch-upload` | `brain-data/upload` 폴더 파일 → /brain/upload/photo·document (서버 실행 중) |
| `pnpm run build-face-db` | 얼굴 DB (faces_src → faces.json) |
| `pnpm run build-timeline` | 타임라인 통계 |
| `pnpm run run-agent` | 에이전트 예제 (질문 → 검색 → Ollama) |
| `pnpm run dev:ui` | 웹 UI (http://localhost:5173) |
| `pnpm run build:ui` | 웹 UI 프로덕션 빌드 |
| `pnpm run test` | 단위 테스트 |
| `pnpm run test:docker` | Qdrant/Mongo/Ollama 연결 테스트 |
| `pnpm run test:upload-photo` | 사진 업로드 API 테스트 |
| `pnpm run test:upload-document` | 문서 업로드 API 테스트 (TXT/PDF/DOCX) |
| `pnpm run clear-timeline` | 타임라인·메모리 삭제 |
| `pnpm run clear-all` | 전체 데이터 삭제 (brain-data 파일은 유지) |
| `pnpm run build` | 빌드 |

---

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3001` | 서버 포트 |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant |
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB |
| `MONGO_DB_NAME` | `custom_brain` | MongoDB DB 이름 |
| `BRAIN_DATA_PATH` | `./brain-data` | 데이터 루트 |
| `VISION_MODEL` | `llava` | 사진 설명 모델 |
| `EMBED_MAX_INPUT_CHARS` | `2000` | 임베딩 입력 최대 문자 (초과 시 1000 등으로 조정) |
| `FACE_MODEL_PATH` | `./face-models` | face-api 모델 폴더 |
| `AI_SERVICE_URL` | (없음) | Python ai-service (예: http://localhost:8000). 음성 STT·Vision·v3 등에 사용 |
| `WHISPER_MODEL` | (ai-service) `base` | Whisper 모델 (base/small/medium/large). ai-service의 `/transcribe`에서 사용 |
| `FACE_SERVICE_URL` | (없음) | 얼굴 인식 서비스 (예: http://localhost:8001) |
| `NEO4J_URI` | (없음) | v3 지식 그래프 (예: bolt://localhost:7687) |
| `S3_BUCKET` | (없음) | 설정 시 업로드를 S3로 (S3_REGION, AWS_ACCESS_KEY_ID 등) |
| `CORS_ORIGIN` | (없음) | 설정 시 CORS 허용 origin (쉼표 구분). 미설정 시 모든 origin 허용 (개발용) |
| `SKIP_AUTH` | (없음) | `true` 또는 `1`이면 `/brain/*` 인증 생략. 로컬 개발 시 Timeline 등 401 방지용 |

`.env` 파일로 덮어쓰기 가능. 예시: `.env.example` 참고.

**프론트엔드**: 인증 사용 시(백엔드에서 `SKIP_AUTH` 미설정) UI에서 API 키를 보내야 함. `frontend/.env`에 `VITE_API_KEY=cb_xxx` 설정 (백엔드에서 API 키 발급 후). `frontend/.env.example` 참고.

**서비스별 env**: ai-service — `HUGGINGFACE_TOKEN` 또는 `PYANNOTE_TOKEN` (pyannote 화자 구분 시). face-service — `INSIGHTFACE_GPU=1` (CUDA 사용 시). Neo4j 설정 시 사진·음성 메모리가 Person–APPEARS_IN/SPOKE–Memory 그래프로 연결됨.

---

## 프로젝트 구조

```
custom-brain/
├── brain-data/           # personal/{notes,documents,projects,photos,voice}, family/{photos,faces_src,faces.json}
├── docker/               # docker-compose.yml (Qdrant, Mongo, ai-service, Neo4j)
├── face-models/          # face-api 모델 (수동 다운로드)
├── frontend/             # 웹 UI (React)
├── ai-service/           # Python FastAPI (Vision, Embed, v3 cluster/summarize/timeline)
├── face-service/         # Python 얼굴 인식 (선택)
├── scripts/              # ingest-*, build-face-db, build-timeline, test-upload-*
└── src/
    ├── api/              # 컨트롤러 (memory, search, timeline, photo, family)
    ├── health/           # GET /health (Mongo·Qdrant 연결 확인)
    ├── agent-tools/      # OpenClaw 툴
    ├── brain-core/       # memory, embedding, search, timeline
    ├── brain/             # chat, ask, RAG, 자동 메모리 평가
    ├── config/            # storage, qdrant, ollama
    ├── ingestion/        # document.process, photo.process
    ├── llm/               # Ollama 클라이언트
    ├── storage/          # file, path, S3
    ├── vector/            # Qdrant
    ├── vision/            # ImageDescribe, docx.ocr, face
    ├── mongo/             # MongoDB
    └── upload/            # upload.controller, upload.service
```

---

## 테스트

- **단위**: `pnpm run test` / `pnpm run test:watch` / `pnpm run test:cov`
- **E2E**: `pnpm run test:e2e`
- **연결**: `pnpm run test:docker` (Qdrant, MongoDB, Ollama)
- **업로드**: `pnpm run test:upload-photo`, `pnpm run test:upload-document` (백엔드 실행 중)
- **테스트 UI**: 서버 실행 후 http://localhost:3001/test → "Run tests"

**테스터 검증**: 코드 수정이 있으면 변경된 기능에 대해 테스터가 반드시 검증해야 합니다. (관련 규칙: `.cursor/rules/tester-after-change.mdc`)

---

## OpenClaw 연동

1. custom-brain 서버 실행: `pnpm run start:dev` (기본 http://localhost:3001).
2. `docs/openclaw/custom-brain/` 폴더를 OpenClaw 스킬 디렉터리로 복사.
3. 다른 호스트/포트면 스킬의 **baseUrl** 을 해당 주소로 수정.

| 항목 | 값 |
|------|-----|
| 질의 (RAG + autoMemory) | `POST /brain/ask` → `{ "question": "..." }` → `{ "answer": "..." }` |
| 채팅 | `POST /brain/chat` → `{ "message": "..." }` → `{ "reply": "...", "memory": { ... } }` |
| 세션 대화 | `GET /brain/memory` → `{ "messages": [...] }` |

상세: `docs/openclaw/custom-brain/SKILL.md`.

---

## 서버 마이그레이션 (다른 서버로 이전 시)

다른 호스트로 custom-brain을 옮길 때 **데이터베이스**와 **파일(문서·사진·음성 등)** 을 함께 옮겨야 합니다.

### 1. 데이터베이스

| 저장소 | 용도 | 마이그레이션 방법 |
|--------|------|------------------|
| **MongoDB** | 메모리 메타·타임라인·가족·인증 사용자 | `mongodump` → 새 서버에서 `mongorestore` |
| **Qdrant** | 메모리·사진 벡터, (선택) 얼굴 벡터 | 스냅샷 생성 후 새 Qdrant에 복원 또는 API로 컬렉션 이전 |
| **Neo4j** (선택) | v3 지식 그래프 | Neo4j 백업/복원 (`neo4j-admin dump` 등) |

**MongoDB**

- DB 이름: `MONGO_DB_NAME` (기본 `custom_brain`).
- 컬렉션: `memories`, `persons`, `graph_edges`, `users` (인증 사용 시).
- 예시 (기존 서버):
  ```bash
  mongodump --uri="mongodb://localhost:27017" --db=custom_brain --out=./mongo-backup
  ```
- 새 서버:
  ```bash
  mongorestore --uri="mongodb://localhost:27017" ./mongo-backup
  ```

**Qdrant**

- 컬렉션: `memories` (768차원), (선택) `faces` (512차원).
- [Qdrant 스냅샷](https://qdrant.tech/documentation/guides/snapshots/) 생성 후 새 인스턴스에 복원하거나, 동일 버전/차원으로 새 서버에 컬렉션을 만들고 벡터를 다시 넣는 방식으로 이전.

### 2. 파일 (문서·사진·음성 등)

로컬 저장 시 모든 미디어는 **`BRAIN_DATA_PATH`** (기본 `./brain-data`) 아래에 있습니다. 이 디렉터리 전체를 새 서버로 복사하면 됩니다.

**폴더 구조 (복사 대상)**

```
brain-data/
├── personal/
│   ├── notes/          # 메모
│   ├── documents/      # 문서 (PDF/DOCX/TXT/MD)
│   ├── projects/
│   ├── photos/         # 사진 (JPG/PNG/WebP)
│   └── voice/          # 음성 (MP3/WAV 등 → Whisper STT 메모리)
├── family/
│   ├── photos/
│   ├── documents/
│   ├── history/
│   ├── faces_src/      # 얼굴 학습용 사진
│   └── faces.json      # 얼굴 DB (build-face-db 산출물)
├── upload/             # 배치 업로드 대기 폴더
└── upload/processed/   # 처리 완료 이동 폴더
```

- **복사 방법**: `rsync`, `scp`, 또는 압축 후 전송.
  ```bash
  rsync -avz ./brain-data/ user@new-server:/path/to/custom-brain/brain-data/
  ```
- **S3 사용 시**: 새 서버에서 같은 S3 버킷을 쓰면 파일 이전 없이 `S3_BUCKET`, `AWS_ACCESS_KEY_ID` 등만 설정. 버킷을 새로 쓰면 기존 버킷 객체를 새 버킷으로 복사하고, 메타데이터의 `filePath`가 `s3:...` 접두사인지 확인.

### 3. 마이그레이션 순서 요약

1. **기존 서버**: 서비스 중지 → MongoDB dump, Qdrant 스냅샷(또는 벡터 이전), (사용 시) Neo4j 백업 → `brain-data` 전체 복사.
2. **새 서버**: MongoDB/Qdrant/Neo4j 설치 및 복원 → `brain-data`를 `BRAIN_DATA_PATH`에 배치 → `.env`에 `MONGO_URL`, `QDRANT_URL`, `MONGO_DB_NAME`, `BRAIN_DATA_PATH`, (선택) `NEO4J_URI`, `S3_*` 등 설정 → 애플리케이션 및 Ollama/ai-service/face-service 실행.
3. **검증**: `GET /health`, 검색·타임라인·업로드 경로 동작 확인.

- 상세 아키텍처·환경 변수: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 라이선스

UNLICENSED
