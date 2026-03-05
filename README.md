# custom-brain

NestJS 기반 **통합 Brain API 서버**. OpenClaw + Local LLM 환경에서 동작하는 개인 ChatGPT 수준 Brain입니다.

## 전체 구조

```
User / OpenClaw Agent
         ↓
   Brain API Server
 ┌───────────────┬───────────────┬───────────────┐
 │ Memory Layer  │ MongoDB Layer │ Code Layer    │
 │ (AutoMemory)  │ (Query Engine)│ (Codebase)    │
 └───────────────┴───────────────┴───────────────┘
         ↓
 Vector Store (Qdrant + Embeddings)
         ↓
      Local LLM (RAG)
```

- **Agent 질문** → 관련 Memory / DB / 코드 context 검색 → LLM reasoning → 답변
- **AutoMemory**: AI가 스스로 지식 축적 (Important? → store / ignore)
- **MongoDB Layer**: 자연어 → Mongo 쿼리 생성 → 실행 → LLM 설명
- **Code Layer**: 프로젝트 코드 이해 + 질문 (인덱싱 후 RAG)

## 목적

- **개인화된 기억이 있는 AI 브레인**을 셀프호스트. 사용자별로 “무엇을 기억할지” 판단하고, 질의 시 관련 메모리를 꺼내 답변하는 **RAG + 메모리** 레이어.
- **채팅/질의 API**로 OpenClaw·봇이 “외부 지식/기억”처럼 붙여 사용.
- **자동 메모리 평가**: LLM이 저장 여부 판단 (Important? → store / ignore).
- **로컬 우선**: Ollama + (선택) Qdrant, MongoDB.

## 스택

- **NestJS** (Node.js)
- **Ollama** (로컬 LLM, 기본 `mistral:7b-instruct`)
- **Qdrant** (선택, 벡터 저장소)

## 빠른 실행 (Family Brain 테스트)

GitHub에서 클론 후 아래만 실행하면 바로 동작합니다.

```bash
git clone <repo-url> && cd custom-brain
pnpm install
# 샘플 파일 준비 (둘 중 하나)
pnpm run sample:seed        # 네트워크 없이 최소 시드 이미지 3장 + 문서 2개 생성
# pnpm run sample:download  # 또는 실제 사진/PDF 다운로드
pnpm run start:dev          # 서버 기동 (기본 포트 3001)
```

- **브라우저** http://localhost:3001/ → **「샘플 데이터 로드」** 클릭 → 추천 질문으로 테스트
- **CLI 초기화**: `pnpm run family:init` 후 `pnpm run family:query "할아버지 이야기 알려줘"`
- **OpenClaw 대화형 테스트**: `node scripts/openclaw-demo.js` ([docs/OPENCLAW_TEST_SCENARIO.md](docs/OPENCLAW_TEST_SCENARIO.md))

(Ollama·Qdrant가 떠 있어야 메모리/질의가 동작합니다. 없으면 서버만 기동됩니다.)

OpenClaw Agent 연동 예제: [docs/openclaw-family.md](docs/openclaw-family.md)

### 샘플 이미지/PDF 다운로드 (바로 테스트용)

아래 스크립트로 **샘플 이미지 3장 + PDF 2개**를 `data/images`, `data/documents` 에 받을 수 있습니다.

```bash
pnpm run sample:download
```

| 저장 위치 | 파일명 | 다운로드 원본 (직접 받을 때) |
|-----------|--------|-----------------------------|
| data/images/ | family_trip_1975.jpg | https://picsum.photos/seed/family-trip-1975/400/300 |
| data/images/ | grandma_birthday_1980.jpg | https://picsum.photos/seed/grandma-birthday-1980/400/300 |
| data/images/ | parents_wedding_2000.jpg | https://picsum.photos/seed/parents-wedding-2000/400/300 |
| data/documents/ | family_letter_1970.pdf | https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf |
| data/documents/ | family_event_1985.pdf | https://www.africau.edu/images/default/sample.pdf |

다운로드 후 `pnpm run family:init` 으로 메모리에 일괄 등록하면, 브라우저/CLI에서 "할머니 여행 사진", "가족 문서" 등으로 질의할 수 있습니다.  
(일부 PDF 링크가 환경에 따라 실패할 수 있습니다. 그 경우 표의 링크를 브라우저에서 열어 `data/documents/` 에 저장하거나, 아무 PDF를 넣어도 됩니다.)

- **자동 로드**: UI에서 **「샘플 데이터 로드」** 버튼으로 `POST /brain/family/initialize` 호출 → 텍스트 + images/documents 폴더가 한 번에 메모리에 올라갑니다.
- 리포 전체 구조: [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md)

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

### 3. Qdrant (메모리/가족 검색 권장)

메모리 저장·검색 및 가족 메모리는 **Qdrant**가 필요합니다. 없으면 앱은 기동하지만 메모리 저장/검색이 비활성화됩니다.

**Docker로 Qdrant만 실행:**

```bash
# 기본 실행 (포트 6333)
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant

# 데이터 유지(볼륨)하고 실행
docker run -d --name qdrant -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

- 브라우저: http://localhost:6333/dashboard (관리 UI)
- 앱은 `http://localhost:6333` 로 자동 연결 (기본 설정)

**중지/삭제:**

```bash
docker stop qdrant
docker rm qdrant
```

### 4. 빌드 및 실행

```bash
# 개발 (watch)
pnpm run start:dev

# 프로덕션
pnpm run build
pnpm run start:prod
```

기본 포트는 **3001**입니다. `PORT=8080 pnpm run start:prod` 로 변경할 수 있습니다.

### 5. 배포 (Docker)

**이미지 빌드 및 실행** (Ollama·Qdrant는 호스트 또는 별도 서비스로 연결):

```bash
docker build -t custom-brain .
docker run -p 3001:3001 --env-file .env custom-brain
```

**docker-compose** (앱 + Qdrant 한 번에):

```bash
docker compose up -d
# Ollama는 호스트에서 실행: ollama serve && ollama pull mistral:7b-instruct
```

- 브라우저: http://localhost:3001/
- 초기화: `curl -X POST http://localhost:3001/brain/family/initialize`
- 샘플 데이터는 호스트의 `data/` 를 마운트해 사용하거나, 컨테이너 안 `data/` 에 미리 넣어두면 됩니다.

## API

| Method | Path | Body | 설명 |
|--------|------|------|------|
| GET | `/` | - | **Family Brain 웹 UI** (public/index.html) |
| GET | `/test` | - | 테스트 러너 UI (브라우저) |
| POST | `/test/run` | - | 테스트 실행 (`pnpm run test`), JSON 결과 반환 |
| GET | `/brain/memory` | - | 현재 세션 대화 목록 |
| POST | `/brain/store` | `{ "text", "metadata"? }` | 메모리 수동 저장 |
| POST | `/brain/search` | `{ "query" }` | 메모리 검색 |
| POST | `/brain/query` | `{ "type": "ask"\|"mongo"\|"code", "question" }` | **통합 쿼리** (OpenClaw queryBrain 용) |
| POST | `/brain/chat` | `{ "message": "..." }` | 채팅 (RAG + 메모리 평가 후 저장) |
| POST | `/brain/ask` | `{ "question": "..." }` | RAG 질의 (searchMemory → LLM → autoMemory) |
| POST | `/brain/mongo` | `{ "question": "..." }` | MongoDB 질의 (쿼리 생성 → 실행 → LLM 설명) |
| POST | `/brain/code` | `{ "question": "..." }` | Code Brain (코드베이스 RAG 질의) |
| POST | `/brain/code/index` | `{ "rootPath": "..." }` | 프로젝트 인덱싱 (로드 → 파싱 → 벡터 저장) |
| POST | `/brain/family/addFolder` | `{ "folderPath", "person"? }` | 가족 사진·문서 폴더 일괄 추가 |
| POST | `/brain/family/addPhoto` | `{ "filePath", "person"? }` | 가족 사진 1건 추가 (경로 → LLM 설명 → 저장) |
| POST | `/brain/family/addDocument` | `{ "filePath", "person"? }` | 가족 문서 1건 추가 (PDF/TXT/MD 요약 → 저장) |
| POST | `/brain/family/initialize` | - | **테스트 초기화**: family_texts.json + images/documents 폴더 일괄 로드 |
| GET | `/brain/family/file` | `?path=...` | 가족 파일 서빙 (data/ 하위 사진·PDF·문서, 브라우저에서 보기용) |

### 테스트 방법

| 목적 | Method | Path | Body |
|------|--------|------|------|
| 메모리 저장 | POST | `/brain/store` | `{ "text": "...", "metadata": {} }` |
| 메모리 검색 | POST | `/brain/search` | `{ "query": "..." }` |
| RAG 질문 | POST | `/brain/ask` | `{ "question": "..." }` |
| MongoDB 질의 | POST | `/brain/mongo` | `{ "question": "..." }` |
| 코드베이스 질문 | POST | `/brain/code` | `{ "question": "..." }` |
| **통합 쿼리** | POST | `/brain/query` | `{ "type": "ask"\|"mongo"\|"code", "question": "..." }` |

### 예시

```bash
# 메모리 저장 / 검색
curl -X POST http://localhost:3001/brain/store -H "Content-Type: application/json" -d '{"text":"사용자는 파란색을 좋아한다"}'
curl -X POST http://localhost:3001/brain/search -H "Content-Type: application/json" -d '{"query":"좋아하는 색"}'

# 통합 쿼리 (OpenClaw queryBrain와 동일)
curl -X POST http://localhost:3001/brain/query -H "Content-Type: application/json" -d '{"type":"ask","question":"1+1은?"}'
curl -X POST http://localhost:3001/brain/query -H "Content-Type: application/json" -d '{"type":"mongo","question":"HU3755048689 상태 알려줘"}'
curl -X POST http://localhost:3001/brain/query -H "Content-Type: application/json" -d '{"type":"code","question":"job scheduler 구조 설명해줘"}'

# 채팅
curl -X POST http://localhost:3001/brain/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕"}'

# 질의 (askBrain)
curl -X POST http://localhost:3001/brain/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"1+1은?"}'

# MongoDB 질의 (쿼리 생성 → 실행 → LLM 설명)
curl -X POST http://localhost:3001/brain/mongo \
  -H "Content-Type: application/json" \
  -d '{"question":"HU3755048689 상태 알려줘"}'

# Code Brain (코드베이스 이해). 인덱싱 후 질의
curl -X POST http://localhost:3001/brain/code/index -H "Content-Type: application/json" -d '{}'
curl -X POST http://localhost:3001/brain/code \
  -H "Content-Type: application/json" \
  -d '{"question":"WCS job scheduler 함수 구조 설명해줘"}'

# 가족 메모리: 폴더 일괄 추가 (사진 + PDF/TXT/MD)
curl -X POST http://localhost:3001/brain/family/addFolder \
  -H "Content-Type: application/json" \
  -d '{"folderPath": "./data/images", "person": "all"}'
# 가족 사진/문서 1건씩
curl -X POST http://localhost:3001/brain/family/addPhoto \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/path/to/photo.jpg", "person": "grandmother"}'
curl -X POST http://localhost:3001/brain/family/addDocument \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/path/to/story.pdf", "person": "grandfather"}'

# 테스트용 초기화 (family_texts.json + data/images + data/documents 한 번에 로드)
curl -X POST http://localhost:3001/brain/family/initialize
```

## 테스트용 가족 데이터셋 (바로 실행 가능)

리포지터리에 **실제 테스트용 데이터**가 포함되어 있어, 서버만 띄우고 초기화하면 바로 질의할 수 있습니다.

| 항목 | 위치 | 설명 |
|------|------|------|
| 텍스트 기록 | `data/family_texts.json` | 할아버지/할머니/부모님 생애·가족 여행·모임 (7건) |
| 사진 예제 | `data/images/` | 파일명 예: family_trip_1975.jpg, grandma_birthday_1980.jpg, parents_wedding_2000.jpg |
| 문서 예제 | `data/documents/` | 파일명 예: family_letter_1970.pdf, family_event_1985.pdf |

**실행 순서 (완전 실행 예제)**

1. `pnpm install` → Ollama·Qdrant 실행 (선택: MongoDB는 mongo 쿼리용)
2. **샘플 파일**: `pnpm run sample:seed` (또는 `pnpm run sample:download`)
3. `pnpm run start:dev` → 서버 기동 (기본 3001)
4. **메모리 로드**: 브라우저 http://localhost:3001/ → **「샘플 데이터 로드」** 클릭 (또는 `pnpm run family:init`)
5. **질문 테스트**: UI 추천 질문 클릭 또는 `pnpm run family:query "할아버지 이야기 알려줘"`
6. **OpenClaw 대화형 시나리오**: `node scripts/openclaw-demo.js` → 4단계 질문 자동 실행 ([docs/OPENCLAW_TEST_SCENARIO.md](docs/OPENCLAW_TEST_SCENARIO.md))

`scripts/query-family-brain.js`는 OpenClaw Agent처럼 `POST /brain/ask`를 호출해 답변만 출력합니다.  
환경 변수: `BRAIN_URL=http://localhost:3001` (기본 3001).

## 가족 메모리 (Family Memory)

가족 히스토리·사진·문서를 **Memory Layer**에 저장하고, 자연어로 검색·질문할 수 있습니다.

- **저장 구조**: `text`(설명/요약) + `embedding` + `metadata` (type, person, source, file, timestamp)
- **metadata.type**: `family_history`(생애·사건) / `family_memory`(추억·사진·문서)
- **metadata.person**: 관련 가족 (grandfather, mother, all 등)
- **metadata.source**: `user_input` / `auto` / `photo` / `document`
- **metadata.file**: 파일 경로 또는 URL (검색 결과에서 파일 안내 가능)

### 사용 흐름

1. **텍스트 저장** — `POST /brain/store` + `metadata: { type: "family_history", person: "grandfather" }`
2. **사진 추가** — `POST /brain/family/addPhoto` (경로 기반 LLM 설명 → 저장)
3. **문서 추가** — `POST /brain/family/addDocument` (PDF/TXT/MD 요약 → 저장)
4. **폴더 일괄** — `POST /brain/family/addFolder` (data/images, data/documents 등)
5. **검색** — `POST /brain/search` (query: "할아버지 출생")
6. **질문** — `POST /brain/ask` (question: "할머니 여행 사진 보여줘") → RAG + 파일 경로 안내

데이터 폴더: `data/images`, `data/documents` (자세한 설명은 `data/README.md`).

## 브라우저 UI (Family Brain Agent)

서버 실행 후 **http://localhost:3001/** 에 접속하면 질문 UI를 사용할 수 있습니다.

- **질문 입력** → AI 답변 + 관련 메모리 검색 결과 표시
- **사진** → 썸네일 클릭 시 `GET /brain/family/file?path=...` 로 새 탭에서 열기
- **PDF/문서** → 링크 클릭 시 새 탭에서 보기 (path는 `data/` 하위여야 함)

`public/` 폴더: `index.html`, `style.css`, `main.js` (정적 파일은 루트 `/` 에서 제공).

## 사용 시나리오 (가족 메모리)

1. **(선택) data/images/** 에 사진, **data/documents/** 에 PDF·문서 넣기 (예제 파일명은 각 폴더 README.txt 참고)
2. **초기화 한 번**  
   `POST /brain/family/initialize`  
   → `data/family_texts.json` 로드 + images/documents 폴더 일괄 저장  
   (또는 개별로 `POST /brain/family/addFolder`)
3. **브라우저에서 http://localhost:3001/** 열기 → 질문 입력 (예: "할머니 여행 사진 보여줘")
4. AI 답변 + 관련 사진·문서 카드 표시 → 사진 클릭 시 열기, 문서 링크 클릭 시 보기
5. **OpenClaw Agent**에서도 `POST /brain/ask` 로 자연어 질문 호출 가능.  
   CLI 테스트: `node scripts/query-family-brain.js "질문"`

## 프로젝트 구조

```
public/                 # Family Brain 웹 UI (정적 파일)
├── index.html
├── style.css
└── main.js
data/
├── family_texts.json   # 테스트용 텍스트 기록 (initialize 시 자동 로드)
├── images/             # 가족 사진 (addFolder/addPhoto로 저장)
├── documents/          # 가족 문서 (PDF, TXT, MD)
└── README.md
scripts/
└── query-family-brain.js   # OpenClaw 스타일 CLI 질의 (node scripts/query-family-brain.js "질문")
src/
├── app.ts                 # 앱 생성/부트스트랩
├── app.module.ts
├── app.controller.ts      # /, /test, /test/run
├── app.service.ts
├── main.ts
├── test-runner.service.ts # 테스트 러너 UI 및 pnpm run test 실행
├── common/
│   ├── constants.ts        # LLM/embed/DB/코드 관련 상수
│   └── llmJson.ts         # parseJsonFromLlm (LLM JSON 파싱)
├── brain/
│   ├── brain.module.ts
│   ├── memory.service.ts
│   ├── memoryEvaluator.service.ts   # autoMemory (Important? → store/ignore)
│   ├── rag.service.ts
│   ├── askBrain.service.ts
│   ├── embedding.service.ts
│   ├── agentMemory.service.ts
│   ├── mongoQuery.service.ts   # Mongo 쿼리 생성 + askDatabase
│   ├── mongoExplain.service.ts # Mongo 실행 + 결과 LLM 설명
│   ├── codeLoader.service.ts   # 프로젝트 파일 로드
│   ├── codeParser.service.ts   # 파일/청크 파싱
│   ├── codeMemory.service.ts   # 코드 벡터 저장·검색
│   ├── codeRag.service.ts      # Code Brain RAG 질의
│   ├── codeIndex.service.ts    # 인덱싱 오케스트레이션
│   ├── familyMemory.service.ts   # 가족 사진/문서 추가 (addPhoto, addDocument, addFamilyFolder)
│   ├── familyInitialize.service.ts # 테스트 초기화 (family_texts.json + images/documents 폴더)
│   ├── types/                    # mongo.types, code.types (LoadedFile, ParsedChunk, CodeSearchResult 등)
│   └── dto/
├── routes/
│   └── brain.routes.ts     # /brain/* 컨트롤러
├── vector/                 # Qdrant 벡터 저장소 (ensureCollection, upsert, search)
├── db/                    # MongoDB 연결 (DatabaseService)
├── llm/                   # Ollama 클라이언트
└── tools/                 # searchMemory, storeMemory, queryKnowledge
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3001` | 서버 포트 |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB 연결 URI |
| `MONGO_DB_NAME` | `custom-brain` | MongoDB DB 이름 |

Ollama는 `http://localhost:11434`, Qdrant는 `http://localhost:6333`를 사용합니다.

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
| **통합 쿼리** | `POST /brain/query` → Body: `{ "type": "ask"\|"mongo"\|"code", "question": "..." }` → 응답: `{ "answer": "..." }` |
| 질의 (RAG + autoMemory) | `POST /brain/ask` → Body: `{ "question": "..." }` → 응답: `{ "answer": "..." }` |
| 채팅 (한 턴) | `POST /brain/chat` → Body: `{ "message": "..." }` → 응답: `{ "reply": "...", "memory": { "important", "stored" } }` |
| 세션 대화 목록 | `GET /brain/memory` → 응답: `{ "messages": [...] }` |
| 메모리 저장/검색 | `POST /brain/store`, `POST /brain/search` |

### OpenClaw queryBrain 연결 예시

에이전트에서 type 하나로 ask / mongo / code를 호출할 때:

```js
async function queryBrain(type, question) {
  const res = await fetch("http://localhost:3001/brain/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, question }),
  });
  return res.json();
}
// queryBrain("ask", "1+1은?"), queryBrain("mongo", "HU 상태 알려줘"), queryBrain("code", "scheduler 구조 설명해줘")
```

OpenClaw 스킬 파일 내용은 `docs/openclaw/custom-brain/SKILL.md` 를 참고하세요.

## 라이선스

UNLICENSED
