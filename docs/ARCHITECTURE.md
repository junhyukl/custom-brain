# Custom Brain — 통합 아키텍처

개인화 AI 브레인(custom-brain)의 시스템 구성, 파이프라인, 프로젝트 구조, 환경을 한 문서로 정리합니다.

---

## 1. 개요

custom-brain은 **메모리·검색·RAG**를 기반으로, **사진/문서 업로드 → 자동 분석·임베딩·저장**, **얼굴 인식 → 가족 그래프**, **v3 Self-Learning(클러스터·요약·지식 그래프)**까지 하나의 브레인으로 통합합니다.

| 레이어 | 설명 |
|--------|------|
| **Backend (NestJS)** | API, 메모리·검색·타임라인·가족·업로드·수집 파이프라인 |
| **AI Service (Python, 선택)** | Vision 캡션, Embedding, v3 cluster/summarize/timeline |
| **Face Service (Python, 선택)** | InsightFace 얼굴 검출·임베딩 |
| **Vector DB** | Qdrant — 메모리·사진 벡터, (선택) 얼굴 벡터 |
| **Document DB** | MongoDB — 메모리 메타, 타임라인, 가족(persons, graph_edges) |
| **Graph DB (선택)** | Neo4j — v3 지식 그래프(Entity, RELATED_TO) |
| **LLM** | Ollama — 질의·캡션·임베딩 |

---

## 2. 시스템 구성도

```
custom-brain
│
├─ backend (NestJS) — 포트 3001
│   ├─ api/           … REST 컨트롤러 (memory, search, timeline, photo, family, upload)
│   ├─ brain-core/    … 메모리 저장·검색·임베딩·타임라인
│   ├─ brain/         … 채팅·질의·RAG·자동 메모리 평가
│   ├─ ingestion/     … 사진·문서 처리 파이프라인 (document.process, photo.process)
│   ├─ upload/        … 파일 수신·저장 (로컬/S3)
│   ├─ vision/        … 이미지 설명·DOCX 추출·face-api 얼굴
│   ├─ vector/        … Qdrant 클라이언트
│   ├─ mongo/         … MongoDB 연결
│   └─ (선택) neo4j/, ai-service/ 클라이언트
│
├─ ai-service (Python FastAPI) — 포트 8000 (선택)
│   ├─ POST /analyze-photo  … Vision 캡션, Embedding
│   ├─ POST /embed          … 텍스트 → 벡터
│   └─ v3: POST /cluster, /summarize, /timeline
│
├─ face-service (Python FastAPI) — 포트 8001 (선택)
│   └─ POST /detect  … 이미지 → 얼굴 임베딩
│
├─ Qdrant (6333)   … memories(768), (선택) faces(512)
├─ MongoDB (27017) … memories, persons, graph_edges
├─ Neo4j (7687)    … v3 Entity, RELATED_TO (선택)
└─ Ollama (11434)  … LLM, Vision, Embedding
```

---

## 3. 파이프라인

### 3.1 업로드 파이프라인 (사진·문서)

**사진** (`POST /brain/upload/photo`):

```
파일 수신·저장 (로컬 또는 S3)
  → EXIF(날짜/GPS) 추출
  → 얼굴 검출 (face-service 또는 face-api + faces.json)
  → Qdrant faces 매칭/등록, graph_edges(photo_together) 갱신
  → Vision 캡션 (ai-service 또는 Nest ImageDescribe)
  → Embedding (ai-service 또는 Nest EmbeddingService)
  → Qdrant + Mongo 메모리 저장, 타임라인 반영
```

**문서** (`POST /brain/upload/document`):

```
파일 수신·저장
  → 텍스트 추출 (PDF: pdf-parse, DOCX: mammoth, TXT/MD: 그대로)
  → Embedding → Qdrant + Mongo 메모리 저장 (type: document)
```

- **AI_SERVICE_URL** 이 있으면 사진은 ai-service의 `/analyze-photo`로 캡션·임베딩을 한 번에 받아 저장.

### 3.2 얼굴 인식 → 가족 그래프

**목표**: 사진 업로드 시 얼굴 검출 → 기존 인물 매칭 또는 신규 등록 → Family Graph 자동 갱신.

```
Photo Upload
  → Face Detection (FACE_SERVICE_URL → InsightFace / 없으면 face-api + faces.json)
  → Qdrant 컬렉션 `faces` 에서 매칭 (score ≥ 0.8 → 기존 personId)
  → 미매칭 시 새 Person 생성 + Qdrant에 얼굴 등록
  → MongoDB graph_edges 에 사진에 함께 등장한 인물 쌍마다 photo_together 엣지 추가
  → 메모리 metadata.people, metadata.personIds 저장
```

**관련 API**: `GET /brain/family/graph` (nodes + edges), `GET /brain/family/tree` (parent 기준 트리).

**컬렉션**:
- Qdrant `faces`: 512차원 얼굴 임베딩, payload `personId`, `personName`, `photoPath`
- MongoDB `graph_edges`: `from`, `to`, `type` (parent | photo_together), `photoPath`, `createdAt`

### 3.3 v3 Self-Learning

**목표**: AI가 메모리를 자동으로 클러스터링·요약·지식 그래프 연결.

```
memory (recall) → 벡터 수집
  → ai-service POST /cluster (KMeans) → 메모리별 clusterId 메타데이터 저장
  → ai-service POST /timeline (LLM) → 시간순 타임라인 텍스트 → 이벤트 저장 (수동 organize 시)
  → metadata.people 기반 Neo4j Entity, RELATED_TO 생성 (NEO4J_URI 설정 시)
  → ai-service POST /summarize (LLM) → 요약 이벤트 저장
```

- **API**: `POST /brain/organize` — 수동 1회 실행.
- **Cron**: 매일 03:00 `clusterMemories`, `generateSummaries`, `updateKnowledgeGraph` (타임라인 생성은 수동만).
- **실행 조건**: AI_SERVICE_URL 설정 시 클러스터·요약·타임라인, NEO4J_URI 설정 시 지식 그래프.

---

## 4. 프로젝트 구조 (src 기준)

**Path alias (tsconfig)**: `@config/*`, `@common/*`, `@schemas/*`

```
src/
├── config/          # 설정 (storage, qdrant, ollama, face)
├── common/          # 상수·유틸 (constants, DOCUMENT_EXT_REGEX 등)
├── schemas/         # Memory, Person, Event, PhotoMemory 등
├── api/             # 컨트롤러 (memory, search, timeline, photo, family, file)
├── mongo/           # MongoDB 연결·컬렉션
├── vector/          # Qdrant, VectorService
├── llm/             # Ollama 클라이언트, Prompt
├── vision/          # ImageDescribe, docx.ocr, face (face-api)
├── storage/         # 파일·경로·S3 (brain-data / S3)
├── neo4j/           # (선택) Neo4j, 지식 그래프
├── brain-core/      # 메모리 CRUD·임베딩·검색·타임라인
├── brain/           # 채팅·질의·RAG·자동 메모리 평가
├── ingestion/       # document.process, photo.process
├── upload/          # upload.controller, upload.service
├── agent-tools/     # OpenClaw 툴 (searchMemory, searchPhotos, …)
├── tools/           # storeMemory, queryKnowledge 등
└── routes/          # brain.routes (레거시)
```

**레이어**

| 레이어 | 폴더 | 역할 |
|--------|------|------|
| 설정·공용 | config, common, schemas | 설정값, 상수, 타입/스키마 |
| 인프라 | mongo, vector, llm, vision, storage, neo4j, ai-service | DB·LLM·파일·외부 서비스 |
| 코어 | brain-core | 메모리·임베딩·검색·타임라인 |
| 기능 | brain, ingestion, upload | 채팅·가족·업로드·수집 |
| API | api | REST 컨트롤러 |
| 도구 | agent-tools, tools, routes | 에이전트 툴·내부 툴 |

**의존성 방향**: api → brain-core, brain, ingestion, upload; brain → brain-core, llm, mongo, vector, vision; ingestion → brain-core, vision, ai-service; upload → storage, ingestion; brain-core → mongo, vector, config, common, schemas.

---

## 5. 환경 변수·Docker

### 5.1 주요 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| PORT | 3001 | 서버 포트 |
| OLLAMA_URL | http://localhost:11434 | Ollama |
| QDRANT_URL | http://localhost:6333 | Qdrant |
| MONGO_URL | mongodb://localhost:27017 | MongoDB |
| AI_SERVICE_URL | (없음) | Python ai-service (예: http://localhost:8000) |
| FACE_SERVICE_URL | (없음) | 얼굴 인식 서비스 (예: http://localhost:8001) |
| NEO4J_URI | (없음) | Neo4j bolt (v3 지식 그래프) |
| NEO4J_USER / NEO4J_PASSWORD | neo4j / (없음) | Neo4j 인증 |
| VISION_MODEL | llava | 사진 설명 모델 |
| EMBED_MAX_INPUT_CHARS | 2000 | 임베딩 입력 최대 문자 |
| BRAIN_DATA_PATH | ./brain-data | 데이터 루트 |
| S3_BUCKET | (없음) | 설정 시 업로드 S3 저장 |

### 5.2 Docker Compose

`docker/docker-compose.yml`:

- **qdrant** — 6333
- **mongo** — 27017
- **ai-service** — 8000 (OLLAMA_HOST=http://host.docker.internal:11434)
- **neo4j** — 7474, 7687 (선택)

로컬 Ollama 실행 시 ai-service 컨테이너는 `host.docker.internal:11434` 로 접속.

---

## 6. API 요약

| 용도 | Method | Path |
|------|--------|------|
| 질의 (RAG + 메모리) | POST | /brain/ask |
| 채팅 | POST | /brain/chat |
| 세션 대화 | GET | /brain/memory |
| 메모리 저장 | POST | /brain/memory |
| 벡터 검색 | GET | /brain/memory/search |
| 사진 검색 | GET | /brain/photos/search |
| 문서 검색 | GET | /brain/documents/search |
| 타임라인 | GET | /brain/timeline |
| 가족 트리 | GET | /brain/family/tree |
| 가족 그래프 | GET | /brain/family/graph |
| 가족 구성원 추가 | POST | /brain/family/persons |
| 사진 업로드 | POST | /brain/upload/photo |
| 문서 업로드 | POST | /brain/upload/document |
| v3 정리 1회 | POST | /brain/organize |

상세 API·에이전트 툴은 루트 [README.md](../README.md) 및 [openclaw/custom-brain/SKILL.md](openclaw/custom-brain/SKILL.md) 참고.

---

## 7. 참고

- **OpenClaw 연동**: [openclaw/custom-brain/SKILL.md](openclaw/custom-brain/SKILL.md) — baseUrl, ask/chat, Agent Tools 테이블.
- **문서 인덱스**: [docs/README.md](README.md).
