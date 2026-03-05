# custom-brain

NestJS 기반 개인화 AI 브레인 API. 메모리 검색·저장, RAG, 자동 메모리 평가(Important? → store/ignore)를 지원합니다.

## 목적

- **개인화된 기억이 있는 AI 브레인**을 셀프호스트할 수 있게 하는 것이 목표입니다. 사용자별로 “무엇을 기억할지” 판단하고, 질의 시 관련 메모리를 꺼내 답변하는 **RAG + 메모리** 레이어를 제공합니다.
- **채팅/질의 API** 하나로, 다른 봇·에이전트(예: OpenClaw, Telegram 봇)가 이 브레인을 “외부 지식/기억”처럼 붙여 쓸 수 있게 합니다.
- **자동 메모리 평가**: 대화나 답변을 “저장할 만한가?” LLM으로 판단해, 중요한 것만 저장하고 나머지는 무시합니다 (Important? → store / ignore).
- **로컬 우선**: Ollama 등 로컬 LLM과 (선택) Qdrant로 동작해, 데이터를 외부 클라우드에 넘기지 않고 쓸 수 있습니다.

## 스택

- **NestJS** (Node.js)
- **Ollama** (로컬 LLM, 기본 `mistral:7b-instruct`)
- **Qdrant** (선택, 벡터 저장소)

## 설치 및 실행

### 1. 의존성

이 프로젝트는 **pnpm**을 사용합니다. [pnpm 설치](https://pnpm.io/installation) 후:

```bash
pnpm install
```

Corepack으로 pnpm 사용 시: `corepack enable` 후 `corepack prepare pnpm@9.15.0 --activate`.

### 2. Ollama (필수)

LLM 응답을 쓰려면 [Ollama](https://ollama.com)를 설치하고 서버를 띄운 뒤, 사용할 모델을 풀하세요.

```bash
ollama serve
ollama pull mistral:7b-instruct
```

### 3. Qdrant + MongoDB (v2 메모리/타임라인/가족)

v2 Memory Core(벡터 검색, 타임라인, 가족 그래프)를 쓰려면 Qdrant와 MongoDB가 필요합니다. 기존에 떠 있는 컨테이너가 있으면 재사용하고, 없으면 새로 띄우는 스크립트를 사용할 수 있습니다.

```powershell
# Windows: Qdrant / Mongo 필요 시에만 컨테이너 생성
.\docker-up.ps1
```

또는 직접 Docker Compose (설정 파일은 `docker/` 폴더):

```bash
docker compose -f docker/docker-compose.yml up -d
```

- Qdrant: `http://localhost:6333`
- MongoDB: `mongodb://localhost:27017`

### 4. 빌드 및 실행

```bash
# 개발 (watch)
pnpm run start:dev

# 프로덕션
pnpm run build
pnpm run start:prod
```

기본 포트는 **3001**입니다. `PORT=8080 pnpm run start:prod` 로 변경할 수 있습니다.

---

## 전체 사용법

### 준비 사항 한눈에

| 항목 | 용도 | 필수 |
|------|------|------|
| **Ollama** | LLM(대화/질의), Vision(사진 설명), Embedding(벡터) | ✅ |
| **Qdrant** | 벡터 검색 (메모리/사진 검색) | ✅ (메모리 사용 시) |
| **MongoDB** | 메모리·가족 메타데이터 저장 | ✅ (메모리 사용 시) |

필요한 Ollama 모델:

```bash
ollama pull mistral:7b-instruct   # 채팅/질의
ollama pull nomic-embed-text      # 벡터 검색
ollama pull llava                 # 사진 설명 (대량 수집 시)
```

---

### 1. 서버 실행

```bash
# 1) 의존성 설치
pnpm install

# 2) Qdrant + MongoDB 띄우기 (기존 컨테이너 있으면 재사용)
.\docker-up.ps1
# 또는: docker compose -f docker/docker-compose.yml up -d

# 3) 서버 실행
pnpm run start:dev
```

서버는 기본적으로 `http://localhost:3001` 에서 동작합니다.

---

### 2. 채팅 / 질의

| 용도 | Method | Path | Body |
|------|--------|------|------|
| 한 턴 채팅 (RAG + 자동 메모리 저장) | POST | `/brain/chat` | `{ "message": "..." }` |
| 질의 (검색 → LLM 답변 → 자동 메모리) | POST | `/brain/ask` | `{ "question": "..." }` |
| 현재 세션 대화 목록 | GET | `/brain/memory` | - |

**예시**

```bash
# 채팅
curl -X POST http://localhost:3001/brain/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"오늘 점심 뭐 먹었지?\"}"

# 질의 (기억 기반 답변)
curl -X POST http://localhost:3001/brain/ask \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"우리 가족 2015년 여행 어디 갔어?\"}"
```

---

### 3. 메모리·검색·타임라인

| 용도 | Method | Path | Query / Body |
|------|--------|------|--------------|
| 메모리 저장 | POST | `/brain/memory` | Body: `{ "content", "scope?", "type?", "metadata?" }` |
| 벡터 검색 | GET | `/brain/memory/search` | `?q=검색어&limit=10&scope=personal\|family` |
| 최근 메모리 목록 | GET | `/brain/memory/recall` | `?limit=50` |
| 사진/문서 검색 | GET | `/brain/photos/search` | `?q=검색어&limit=10` |
| 문서 검색 | GET | `/brain/documents/search` | `?q=검색어&limit=10` |
| 타임라인 | GET | `/brain/timeline` | `?scope=personal\|family&limit=100` |

**예시**

```bash
# 메모리 저장
curl -X POST http://localhost:3001/brain/memory \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"2020년 3월 테슬라 구매\",\"type\":\"event\",\"scope\":\"personal\",\"metadata\":{\"date\":\"2020-03\"}}"

# 벡터 검색
curl "http://localhost:3001/brain/memory/search?q=가족+여행&limit=5"

# 타임라인
curl "http://localhost:3001/brain/timeline?limit=20"
```

#### 3-2. Agent + Ollama (질문 → AI 답변)

사진·문서·메모리 검색 툴과 Ollama를 연결해 **질문 → 검색 → LLM 답변**을 한 번에 실행할 수 있습니다.

```bash
# custom-brain 서버 + Ollama 실행 후
pnpm run run-agent
```

- 스크립트가 예시 질문 3개(가족 여행 사진, 할아버지 사진, Tesla 문서)에 대해 **searchMemory / searchPhotos / searchDocuments / timeline / familyTree** 로 context를 모은 뒤 Ollama에 전달해 답변을 출력합니다.
- OpenClaw 등 에이전트에서는 `docs/openclaw/custom-brain/SKILL.md` 의 Agent Tools 테이블을 참고해 동일한 엔드포인트를 도구로 등록하면 됩니다.

---

### 4. Photo + Face Ingestion (사진 10만 장 + 얼굴 인식 + 가족 태깅)

수천~수만 장을 **폴더 스캔 → 얼굴 인식 & 태깅 → Vision 설명 → 임베딩 → Qdrant + Memory** 로 자동 구축합니다.

#### 4-1. 폴더 구조

```
brain-data/
  personal/
    photos/           # 개인 사진 (프로젝트, 메모 등)
      projects/
      notes/
        work1.jpg
        work2.png
  family/
    photos/            # 가족 사진
      2015_korea_trip/
        IMG_001.jpg
        IMG_002.jpg
      grandfather/
        birthday2019.jpg
    faces_src/         # 얼굴 DB 구축용: 인물당 사진 1장
        Grandfather_01.jpg   → 이름: Grandfather
        Mother_02.png       → 이름: Mother
    faces.json         # (생성됨) pnpm run build-face-db 실행 후
```

- **personal/photos**, **family/photos** 둘 다 스캔됩니다.
- 지원 확장자: `.jpg`, `.jpeg`, `.png`, `.webp`.

#### 4-2. 얼굴 DB 구축 (처음 한 번만)

가족 얼굴 태깅을 쓰려면 **faces_src/** 에 인물당 사진 1장을 넣고 DB를 만듭니다.

```bash
# 1) face-api 모델 다운로드 (프로젝트 루트에 face-models/ 생성)
#    https://github.com/vladmandic/face-api-models 에서
#    ssd_mobilenetv1_model-weights_manifest.json, face_landmark_68_model-*, face_recognition_model-*
#    등을 face-models/ 폴더에 넣거나, FACE_MODEL_PATH 환경 변수로 경로 지정.

# 2) brain-data/family/faces_src/ 에 인물별 사진 추가 (파일명: 이름_번호.jpg)

# 3) 얼굴 DB 생성 → brain-data/family/faces.json
pnpm run build-face-db
```

face-api 모델 파일은 [vladmandic/face-api-models](https://github.com/vladmandic/face-api-models) 또는 [face-api.js weights](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) 에서 내려받아 `face-models/` 에 넣으면 됩니다.

이후 `ingest-photos` 실행 시 사진 속 얼굴이 **faces.json** 과 매칭되어 `metadata.people` 에 이름이 들어갑니다.

#### 4-3. 수집 스크립트 실행

Ollama, Qdrant, MongoDB만 켜두고 스크립트만 실행하면 됩니다.

```bash
# personal/photos + family/photos 모두 스캔 (얼굴 인식 → Vision → embedding → Qdrant + Memory)
pnpm run ingest-photos
```

- 각 이미지: **EXIF(날짜/GPS)** 추출 → **얼굴 인식** (faces.json 있으면) → **Vision(llava)** 설명 → **embedding** → **Qdrant + Mongo** 저장.
- 콘솔에 `processing <경로>`, `(N faces: 이름1, 이름2)` 및 `Done. { done, skip, err }` 가 출력됩니다.

#### 4-3-2. 통합 수집 (사진 + 문서 + 메모) — ingest-all

한 번에 **사진** + **문서**(PDF, DOCX, TXT, MD)를 스캔해 벡터화·Qdrant·Memory에 넣습니다.

```bash
pnpm run ingest-all
```

- 스캔 경로: `brain-data/personal` (notes, documents, projects, photos), `brain-data/family` (photos, documents, history). `faces_src/`는 제외.
- **사진**: 기존과 동일 (얼굴 인식 → Vision → embedding → Memory).
- **문서**: PDF/DOCX는 텍스트 추출, TXT/MD는 그대로 → embedding → Memory (type: `document`). 이후 `/brain/memory/search`·OpenClaw로 검색 가능.

#### 4-3-3. Full Pipeline (병렬 수집 + 타임라인)

사진 10만 장·수천 문서를 **병렬 처리**하고, **타임라인 통계**를 뽑을 때:

```bash
# 1) 얼굴 DB 구축 (처음 한 번)
pnpm run build-face-db

# 2) 병렬 ingestion (기본 10 workers, INGEST_WORKERS=20 등으로 변경 가능)
pnpm run ingest-all-parallel

# 3) 타임라인 통계 (연도별 메모리 건수)
pnpm run build-timeline
```

- **ingest-all-parallel**: `async` 큐로 사진·문서를 동시에 처리. EXIF 날짜·GPS는 사진 메타데이터에 자동 반영.
- **build-timeline**: Mongo 메모리 기준 연도별 건수 출력. 타임라인 조회는 `GET /brain/timeline` 으로 실시간 제공.

#### 4-4. 사진 한 장만 API로 분석

이미지(base64) 한 장을 보내서 설명 생성 + 메모리 저장:

```bash
# base64 이미지를 POST (실제로는 이미지 파일을 base64 인코딩해서 전송)
curl -X POST http://localhost:3001/brain/photo/analyze \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"<base64 문자열>\",\"date\":\"2015-08\",\"people\":[\"엄마\",\"아빠\"]}"
```

---

### 5. 가족 트리

| 용도 | Method | Path | Body |
|------|--------|------|------|
| 가족 트리 조회 | GET | `/brain/family/tree` | - |
| 가족 구성원 추가 | POST | `/brain/family/persons` | `{ "name", "relation", "birthDate?", "description?", "parentIds?" }` |

**relation** 예: `father`, `mother`, `grandfather`, `grandmother`, `child`, `spouse`, `sibling`.

**예시**

```bash
# 구성원 추가
curl -X POST http://localhost:3001/brain/family/persons \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"홍길동\",\"relation\":\"grandfather\",\"birthDate\":\"1940-01-15\",\"description\":\"할아버지\"}"

# 트리 조회
curl http://localhost:3001/brain/family/tree
```

---

### 6. 스크립트 요약

| 명령 | 설명 |
|------|------|
| `pnpm run start:dev` | 개발 서버 (watch) |
| `pnpm run start:prod` | 프로덕션 서버 |
| `pnpm run ingest-photos` | personal + family 사진 스캔 → 얼굴 태깅 → Vision → AI 메모리 수집 |
| `pnpm run ingest-all` | 사진 + 문서(PDF/DOCX/TXT/MD) 통합 스캔 → 벡터화 → Qdrant·Memory |
| `pnpm run ingest-all-parallel` | 병렬 수집 (WORKERS=10, 사진·문서 동시 처리) |
| `pnpm run build-face-db` | faces_src/ → faces.json (가족 얼굴 DB 구축) |
| `pnpm run build-timeline` | 메모리 연도별 타임라인 통계 출력 |
| `pnpm run run-agent` | Agent 예제 (질문 → 검색 툴 → Ollama → 답변) |
| `pnpm run build` | 빌드 |
| `pnpm run test` | 단위 테스트 |

---

### 7. 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3001` | 서버 포트 |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant API |
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB 연결 문자열 |
| `MONGO_DB_NAME` | `custom_brain` | MongoDB DB 이름 |
| `BRAIN_DATA_PATH` | `./brain-data` | brain-data 루트 경로 |
| `PHOTO_DIR` | (사용 안 함, personal/family 고정) | - |
| `VISION_MODEL` | `llava` | 사진 설명용 Vision 모델 |
| `FACE_MODEL_PATH` | `./face-models` | face-api 모델 파일 폴더 (얼굴 인식용) |

`.env` 파일을 만들어 두면 위 값들을 덮어쓸 수 있습니다.

---

## API

| Method | Path | Body | 설명 |
|--------|------|------|------|
| GET | `/` | - | 헬스 체크 |
| GET | `/test` | - | 테스트 러너 UI (브라우저) |
| POST | `/test/run` | - | 테스트 실행 (`pnpm run test`), JSON 결과 반환 |
| GET | `/brain/memory` | - | 현재 세션 대화 목록 |
| POST | `/brain/chat` | `{ "message": "..." }` | 채팅 (RAG + 메모리 평가 후 저장) |
| POST | `/brain/ask` | `{ "question": "..." }` | 질의 (searchMemory → LLM → autoMemory 후 답변 반환) |

### Memory Core API (v2, 벡터 검색)

| Method | Path | Body / Query | 설명 |
|--------|------|--------------|------|
| POST | `/brain/memory` | `{ "content", "scope?", "type?", "metadata?", "source?" }` | 메모리 저장 (Qdrant + Mongo) |
| GET | `/brain/memory/search` | `?q=...&limit=10&scope=personal|family` | 벡터 검색 |
| GET | `/brain/documents/search` | `?q=...&limit=10` | 문서 타입 메모리 검색 |
| GET | `/brain/timeline` | `?scope=&limit=100` | 날짜 기준 타임라인 |
| GET | `/brain/family/tree` | - | 가족 그래프 |
| POST | `/brain/family/persons` | `{ "name", "relation", "birthDate?", "description?", "parentIds?" }` | 가족 구성원 추가 |
| POST | `/brain/photo/analyze` | `{ "image": "base64...", "date?", "source?", "people?" }` | 사진 분석 후 메모리 저장 (Vision) |

검색·타임라인·가족 트리는 **OpenClaw 툴**로도 사용 가능: `search_memory`, `search_photos`, `family_tree`, `timeline`.

### 예시

```bash
# 채팅
curl -X POST http://localhost:3001/brain/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕"}'

# 질의 (askBrain)
curl -X POST http://localhost:3001/brain/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"1+1은?"}'
```

## 프로젝트 구조 (v2)

```
custom-brain/
├── brain-data/            # 실제 기억 데이터 (personal / family)
│   ├── personal/notes, documents, projects, photos
│   └── family/photos, faces_src, faces.json
├── docker/
│   └── docker-compose.yml # Qdrant + Mongo
├── face-models/           # face-api 모델 파일 (얼굴 인식용, 수동 다운로드)
├── scripts/
│   ├── ingest-photos.ts   # personal + family 사진 스캔 → 얼굴·Vision·임베딩·Qdrant·Memory
│   ├── ingest-all.ts           # 사진 + 문서 통합 스캔 → Memory
│   ├── ingest-all-parallel.ts   # 병렬 수집 (async queue)
│   ├── build-face-db.ts         # faces_src/ → faces.json (가족 얼굴 DB)
│   ├── build-timeline.ts        # 타임라인 통계 (연도별 건수)
│   ├── ingest-folder.ts   # 폴더 스캔 후 API로 수집
│   └── rebuild-vector.ts  # 벡터 인덱스 재구성
└── src/
    ├── api/               # HTTP 컨트롤러
    │   ├── memory.controller.ts
    │   ├── search.controller.ts
    │   ├── timeline.controller.ts
    │   ├── photo.controller.ts
    │   └── family.controller.ts
    ├── agent-tools/       # OpenClaw용 툴 (search_memory, search_photos, timeline, family_tree)
    ├── brain-core/        # 메모리·검색·타임라인 핵심
    │   ├── memory.service.ts
    │   ├── embedding.service.ts
    │   ├── search.service.ts
    │   └── timeline.service.ts
    ├── brain-schema/      # Memory, Person, Event, PhotoMemory 스키마
    ├── brain/             # 채팅·RAG·가족·자동 메모리 평가
    ├── config/            # qdrant, ollama, storage 설정
    ├── ingestion/         # photo.ingest, photo.process(얼굴+Vision+저장), document, email
    ├── llm/               # Ollama 클라이언트, PromptService
    ├── storage/           # file.service, path.service (brain-data 경로)
    ├── vector/            # Qdrant 클라이언트, VectorService
    ├── vision/            # ImageDescribeService, face.recognition(얼굴 인식), OcrService
    ├── mongo/             # MongoDB 연결
    └── tools/             # 툴 구현 (agent-tools에서 re-export)
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3001` | 서버 포트 |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant API |
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB 연결 문자열 |
| `MONGO_DB_NAME` | `custom_brain` | MongoDB DB 이름 |
| `VISION_MODEL` | `llava` | 사진 분석용 Vision 모델 (Ollama) |

`.env.example`을 참고해 `.env`를 만들 수 있습니다.

## 테스트

- **CLI:** `pnpm run test` / `pnpm run test:watch` / `pnpm run test:cov` / `pnpm run test:e2e`
- **테스트 UI:** 서버 실행 후 [http://localhost:3001/test](http://localhost:3001/test) 에서 "Run tests" 클릭 → `pnpm run test` 결과 표시

## 스크립트

| 스크립트 | 설명 |
|----------|------|
| `pnpm run build` | 빌드 |
| `pnpm run start` | 일반 시작 |
| `pnpm run start:dev` | watch 모드 |
| `pnpm run start:prod` | dist 기반 프로덕션 |
| `pnpm run ingest-photos` | personal + family 사진 스캔 → 얼굴 태깅 → Vision·임베딩·Qdrant·Memory |
| `pnpm run ingest-all` | 사진 + 문서(PDF/DOCX/TXT/MD) 통합 스캔 → Memory |
| `pnpm run ingest-all-parallel` | 병렬 수집 (사진·문서 동시 처리) |
| `pnpm run build-face-db` | faces_src/ → faces.json (가족 얼굴 DB) |
| `pnpm run build-timeline` | 타임라인 통계 (연도별 건수) |
| `pnpm run lint` | ESLint |
| `pnpm run format` | Prettier |
| `pnpm run test` | 단위 테스트 (Jest) |
| `pnpm run test:watch` | 테스트 watch |
| `pnpm run test:cov` | 커버리지 |
| `pnpm run test:e2e` | E2E 테스트 |

## OpenClaw 연동

[OpenClaw](https://docs.openclaw.ai) 에이전트에서 custom-brain API를 사용하려면 아래 중 하나를 적용하면 됩니다.

### 1. 스킬로 연동 (권장)

1. **custom-brain 서버 실행**  
   `pnpm run start:dev` 또는 `pnpm run start:prod`로 `http://localhost:3001` 에서 동작하도록 합니다.

2. **OpenClaw 워크스페이스에 스킬 복사**  
   이 저장소의 `docs/openclaw/custom-brain/` 폴더 전체를 OpenClaw 스킬 디렉터리로 복사합니다.

   ```bash
   # OpenClaw 워크스페이스 skills 경로 (기본 예시)
   cp -r docs/openclaw/custom-brain ~/.openclaw/workspace/skills/
   ```

   워크스페이스 경로는 `openclaw.json`의 `agents.defaults.workspace` 또는 `openclaw setup`으로 확인할 수 있습니다.

3. **HTTP 요청 가능 스킬 확인**  
   OpenClaw에 **api-tester** 등 HTTP 요청을 수행하는 스킬이 있어야 합니다. 없으면 [ClawHub](https://clawhub.com) 또는 문서에서 해당 스킬을 설치합니다.

4. **게이트웨이 재시작 또는 스킬 새로고침**  
   스킬을 추가한 뒤 게이트웨이를 재시작하거나, 에이전트에게 "refresh skills"를 요청합니다.

이후 에이전트에게 "브레인에게 질문해줘", "custom brain에 이걸 물어봐" 등으로 요청하면, 스킬 설명에 따라 `POST /brain/ask` 또는 `POST /brain/chat` 를 호출하게 됩니다.

### 2. API 주소 변경

custom-brain이 다른 호스트/포트에서 동작하면, 복사한 스킬의 `SKILL.md` 안 **baseUrl** 설명을 해당 주소로 바꿉니다 (예: `http://192.168.1.10:3001`).

### 3. 연동 요약

| 항목 | 값 |
|------|-----|
| custom-brain 기본 URL | `http://localhost:3001` |
| 질의 (RAG + autoMemory) | `POST /brain/ask` → Body: `{ "question": "..." }` → 응답: `{ "answer": "..." }` |
| 채팅 (한 턴) | `POST /brain/chat` → Body: `{ "message": "..." }` → 응답: `{ "reply": "...", "memory": { "important", "stored" } }` |
| 세션 대화 목록 | `GET /brain/memory` → 응답: `{ "messages": [...] }` |

OpenClaw 스킬 파일 내용은 `docs/openclaw/custom-brain/SKILL.md` 를 참고하세요.

## 라이선스

UNLICENSED
