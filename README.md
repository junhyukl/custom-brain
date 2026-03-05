# custom-brain

NestJS 기반 개인화 AI 브레인 API. 메모리 검색·저장, RAG, 자동 메모리 평가(Important? → store/ignore)를 지원합니다.

## 스택

- **NestJS** (Node.js)
- **Ollama** (로컬 LLM, 기본 `mistral:7b-instruct`)
- **Qdrant** (선택, 벡터 저장소)

## 설치 및 실행

### 1. 의존성

```bash
npm install
```

### 2. Ollama (필수)

LLM 응답을 쓰려면 [Ollama](https://ollama.com)를 설치하고 서버를 띄운 뒤, 사용할 모델을 풀하세요.

```bash
ollama serve
ollama pull mistral:7b-instruct
```

### 3. Qdrant (선택)

장기 메모리/벡터 검색을 쓰려면 [Qdrant](https://qdrant.tech)를 실행하세요. 없어도 앱은 동작하며, 메모리 저장·검색은 스텁으로 남습니다.

```bash
# Docker 예시
docker run -p 6333:6333 qdrant/qdrant
```

### 4. 빌드 및 실행

```bash
# 개발 (watch)
npm run start:dev

# 프로덕션
npm run build
npm run start:prod
```

기본 포트는 **3001**입니다. `PORT=8080 npm run start:prod` 로 변경할 수 있습니다.

## API

| Method | Path | Body | 설명 |
|--------|------|------|------|
| GET | `/` | - | 헬스 체크 |
| GET | `/test` | - | 테스트 러너 UI (브라우저) |
| POST | `/test/run` | - | 테스트 실행 (`npm run test`), JSON 결과 반환 |
| GET | `/brain/memory` | - | 현재 세션 대화 목록 |
| POST | `/brain/chat` | `{ "message": "..." }` | 채팅 (RAG + 메모리 평가 후 저장) |
| POST | `/brain/ask` | `{ "question": "..." }` | 질의 (searchMemory → LLM → autoMemory 후 답변 반환) |

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

## 프로젝트 구조

```
src/
├── app.ts                 # 앱 생성/부트스트랩
├── app.module.ts
├── app.controller.ts      # /, /test, /test/run
├── app.service.ts
├── main.ts
├── test-runner.service.ts # 테스트 러너 UI 및 npm run test 실행
├── common/
│   └── constants.ts       # DEFAULT_LLM_MODEL 등
├── brain/
│   ├── brain.module.ts
│   ├── memory.service.ts
│   ├── memoryEvaluator.service.ts   # autoMemory (Important? → store/ignore)
│   ├── rag.service.ts
│   ├── askBrain.service.ts
│   ├── embedding.service.ts
│   ├── agentMemory.service.ts
│   └── dto/
├── routes/
│   └── brain.routes.ts     # /brain/* 컨트롤러
├── vector/                # Qdrant 벡터 저장소
├── llm/                   # Ollama 클라이언트
└── tools/                 # searchMemory, storeMemory, queryKnowledge
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3001` | 서버 포트 |

Ollama는 `http://localhost:11434`, Qdrant는 `http://localhost:6333`를 사용합니다.

## 테스트

- **CLI:** `npm run test` / `npm run test:watch` / `npm run test:cov` / `npm run test:e2e`
- **테스트 UI:** 서버 실행 후 [http://localhost:3001/test](http://localhost:3001/test) 에서 "Run tests" 클릭 → `npm run test` 결과 표시

## 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run build` | 빌드 |
| `npm run start` | 일반 시작 |
| `npm run start:dev` | watch 모드 |
| `npm run start:prod` | dist 기반 프로덕션 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | 단위 테스트 (Jest) |
| `npm run test:watch` | 테스트 watch |
| `npm run test:cov` | 커버리지 |
| `npm run test:e2e` | E2E 테스트 |

## 라이선스

UNLICENSED
