# Custom Brain v2 — Auto Memory Pipeline

가족 기록 + 개인 지식을 하나의 AI brain으로 만드는 아키텍처와 실행 구조입니다.

## 1. 전체 아키텍처 (v2)

```
custom-brain
│
├─ backend (NestJS)
│   ├─ upload      … 파일 수신, 저장
│   ├─ memory     … 메모리 저장/검색 (Mongo + Qdrant)
│   ├─ search     … 시맨틱 검색 (POST /brain/search)
│   ├─ timeline   … 타임라인 (Mongo)
│   └─ family     … 가족 그래프 (Mongo + 선택 Neo4j)
│
├─ ai-service (Python FastAPI)
│   ├─ embedding     … POST /embed (nomic-embed-text)
│   ├─ vision caption… POST /analyze-photo (llava)
│   ├─ OCR           … 플레이스홀더 (확장 가능)
│   └─ face recognition … face-service (8001) 별도
│
├─ vector-db  … Qdrant (6333)
├─ graph-db   … Neo4j (7687, 선택)
└─ llm        … Ollama (11434)
```

**핵심 DB**

| 역할           | 저장소   | 비고                    |
|----------------|----------|-------------------------|
| Vector memory  | Qdrant   | 메모리/사진 시맨틱 검색 |
| Family graph   | MongoDB  | persons, graph_edges    |
| Family graph   | Neo4j    | 선택, NEO4J_URI 설정 시 |
| Local LLM      | Ollama   | 질의/캡션/임베딩        |

## 2. Auto Memory Pipeline

파일 업로드 시 자동 처리 흐름:

```
Upload (POST /brain/upload/photo)
  ↓
AI 분석 (ai-service 또는 Nest 내장)
  ↓
Metadata 생성 (caption, people, path)
  ↓
Embedding 생성 (ai-service 또는 Nest EmbeddingService)
  ↓
Vector DB 저장 (Qdrant)
  ↓
Timeline 업데이트 (Mongo / addEvent)
  ↓
Family graph 업데이트 (Mongo + 선택 Neo4j)
```

- **AI_SERVICE_URL** 이 설정되면: Python ai-service의 `/analyze-photo`로 캡션·임베딩·people 받아 한 번에 저장.
- 설정되지 않으면: 기존처럼 Nest 내부에서 Vision(ImageDescribe) + Embedding 사용.

## 3. NestJS Upload API

- `POST /brain/upload/photo` — `FileInterceptor('file')`, 사진 저장 후 위 파이프라인 실행.
- `POST /brain/upload/document` — 문서 저장 후 텍스트 추출 → 메모리 저장.

## 4. Search API

- `GET /brain/memory/search?q=...&limit=...` — 기존 시맨틱 검색.
- **v2** `POST /brain/search` — body: `{ "query": "할아버지랑 찍은 사진", "limit": 10 }` → 임베딩 후 벡터 검색.

## 5. Brain Ask API

- `POST /brain/ask` — body: `{ "question": "..." }`  
  메모리 검색으로 context 구성 후 LLM에 질의해 답변 반환.

## 6. 환경 변수 (v2)

| 변수            | 기본값              | 설명                          |
|-----------------|---------------------|-------------------------------|
| AI_SERVICE_URL  | (없음)              | Python ai-service (예: http://localhost:8000) |
| NEO4J_URI       | (없음)              | Neo4j bolt (예: bolt://localhost:7687) |
| NEO4J_USER      | neo4j               | Neo4j 사용자                  |
| NEO4J_PASSWORD  | (없음)              | Neo4j 비밀번호                |
| FACE_SERVICE_URL| (없음)              | 얼굴 인식 서비스 (예: http://localhost:8001) |

## 7. Docker Compose (v2 서비스)

`docker/docker-compose.yml` 에 포함:

- **qdrant** — 6333
- **mongo** — 27017
- **ai-service** — 8000 (빌드: `ai-service/Dockerfile`)
- **neo4j** — 7474 (HTTP), 7687 (bolt)

로컬에서 Ollama 실행 중이면 ai-service 컨테이너에선 `OLLAMA_HOST=http://host.docker.internal:11434` 로 접속.

## 8. 모바일 업로드

동일 API 사용 가능:

- phone → `POST /brain/upload/photo` (multipart) → auto analyze → vector memory  
사진·문서·음성(추후)·스캔(OCR 확장) 모두 동일 파이프라인으로 확장 가능.
