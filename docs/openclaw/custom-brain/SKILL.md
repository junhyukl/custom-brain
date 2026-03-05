---
name: custom_brain
description: 사용자 개인화 브레인 API(custom-brain)에 질의하거나 채팅합니다. 메모리 검색·RAG·자동 저장을 사용합니다.
---

# Custom Brain 연동

custom-brain은 사용자별 메모리·RAG·자동 메모리 평가를 제공하는 API입니다.  
이 스킬은 **HTTP 요청 도구**(예: api-tester의 `request`)를 사용해 custom-brain 서버를 호출하는 방법을 안내합니다.

**통합 Brain**: Memory(AutoMemory) + MongoDB Query + Codebase 이해를 하나의 서버에서 제공합니다.

## 기본 URL

- **baseUrl**: `http://localhost:3001` (custom-brain을 같은 머신에서 실행할 때)
- 다른 호스트/포트라면 아래 경로 앞에 해당 baseUrl을 붙여 사용하세요.

## 엔드포인트

### 0. 통합 쿼리 (query) — OpenClaw queryBrain 용

type 한 개로 ask / mongo / code 를 선택합니다.

- **Method**: `POST`
- **URL**: `{baseUrl}/brain/query`
- **Body**: `{ "type": "ask" | "mongo" | "code", "question": "..." }`
- **응답**: `{ "answer": "..." }` (mongo일 때는 추가로 `mongoQuery`, `result` 포함)

### 1. 메모리 저장 (store) / 검색 (search)

- **POST** `{baseUrl}/brain/store` — Body: `{ "text": "...", "metadata": {} }` → `{ "status": "stored" }`
- **POST** `{baseUrl}/brain/search` — Body: `{ "query": "..." }` → 검색 결과 배열

### 2. 질의 (ask) — RAG + 자동 메모리

사용자가 "브레인에게 물어봐", "기억한 걸로 답해줘" 등으로 요청할 때 사용합니다.

- **Method**: `POST`
- **URL**: `{baseUrl}/brain/ask`
- **Headers**: `Content-Type: application/json`
- **Body**: `{ "question": "사용자 질문 내용" }`
- **응답**: `{ "answer": "..." }` → `answer` 값을 사용자에게 전달

### 3. 채팅 (chat) — 한 턴 대화

일반적인 한 턴 대화를 브레인에 넘길 때 사용합니다.

- **Method**: `POST`
- **URL**: `{baseUrl}/brain/chat`
- **Headers**: `Content-Type: application/json`
- **Body**: `{ "message": "사용자 메시지" }`
- **응답**: `{ "reply": "...", "memory": { "important", "stored" } }` → `reply` 값을 사용자에게 전달

### 4. 세션 대화 목록 (memory)

현재 세션의 대화 목록을 조회할 때 사용합니다.

- **Method**: `GET`
- **URL**: `{baseUrl}/brain/memory`
- **응답**: `{ "messages": [ { "role", "content" }, ... ] }`

### 5. MongoDB 질의 (mongo) — 쿼리 생성 → 실행 → LLM 설명

사용자가 DB 내용을 물어볼 때(예: "HU3755048689 상태 알려줘") 사용합니다. Brain API가 질문 → Mongo 쿼리 생성 → MongoDB 실행 → 결과를 LLM이 설명해 반환합니다.

- **Method**: `POST`
- **URL**: `{baseUrl}/brain/mongo`
- **Headers**: `Content-Type: application/json`
- **Body**: `{ "question": "사용자 질문 (예: HU3755048689 상태 알려줘)" }`
- **응답**: `{ "mongoQuery": { "collection", "query" }, "result": [...], "answer": "..." }` → `answer` 값을 사용자에게 전달

### 6. Code Brain (code) — 코드베이스 이해 / RAG

사용자가 프로젝트 코드 구조·함수 설명 등을 물어볼 때 사용합니다. (먼저 `POST /brain/code/index`로 프로젝트를 인덱싱해야 할 수 있습니다.)

- **Method**: `POST`
- **URL**: `{baseUrl}/brain/code`
- **Headers**: `Content-Type: application/json`
- **Body**: `{ "question": "예: WCS job scheduler 함수 구조 설명해줘" }`
- **응답**: `{ "answer": "..." }` → `answer` 값을 사용자에게 전달

인덱싱 (선택, 코드 검색 전 한 번):

- **Method**: `POST`
- **URL**: `{baseUrl}/brain/code/index`
- **Body**: `{ "rootPath": "프로젝트 루트 경로" }` (생략 시 서버 cwd)

## OpenClaw Tool 예시

### queryBrain (통합 — 권장)

type으로 ask / mongo / code 중 하나를 선택해 한 엔드포인트로 호출합니다.

```js
async function queryBrain(type, question) {
  const res = await fetch("http://localhost:3001/brain/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, question }),
  });
  return res.json();
}

// 사용: queryBrain("ask", "1+1은?"), queryBrain("mongo", "HU 상태 알려줘"), queryBrain("code", "scheduler 구조 설명해줘")
```

응답은 항상 `answer` 필드를 가지며, mongo일 때는 `mongoQuery`, `result`도 포함됩니다.

### 개별 엔드포인트

- **queryMongo(question)**: `POST /brain/mongo`, body `{ question }`
- **queryCodeBrain(question)**: `POST /brain/code`, body `{ question }`
- **store / search**: `POST /brain/store` (body: `{ text, metadata? }`), `POST /brain/search` (body: `{ query }`)

## 사용 시점

- 사용자가 **질문을 “브레인/기억”에 기반해 답해달라고 할 때** → `POST /brain/ask` 사용.
- 사용자가 **단순히 브레인과 대화한 턴을 처리할 때** → `POST /brain/chat` 사용.
- 사용자가 **지금까지 뭐라고 했는지 보고 싶어할 때** → `GET /brain/memory` 사용.
- 사용자가 **DB/배송·HU 등 데이터를 조회해 설명해달라고 할 때** → `POST /brain/mongo` 사용.
- 사용자가 **코드베이스/함수 구조/설명**을 물어볼 때 → `POST /brain/code` 사용 (필요 시 먼저 `/brain/code/index` 호출).

## 주의

- custom-brain 서버가 baseUrl에서 실행 중이어야 합니다 (`pnpm run start:dev` 또는 `pnpm run start:prod`).
- HTTP 요청 실패 시(연결 거부, 타임아웃 등) 사용자에게 "브레인 서버에 연결할 수 없습니다" 등으로 안내하세요.
