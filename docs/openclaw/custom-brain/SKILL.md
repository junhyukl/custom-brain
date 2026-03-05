---
name: custom_brain
description: 사용자 개인화 브레인 API(custom-brain)에 질의하거나 채팅합니다. 메모리 검색·RAG·자동 저장을 사용합니다.
---

# Custom Brain 연동

custom-brain은 사용자별 메모리·RAG·자동 메모리 평가를 제공하는 API입니다.  
이 스킬은 **HTTP 요청 도구**(예: api-tester의 `request`)를 사용해 custom-brain 서버를 호출하는 방법을 안내합니다.

## 기본 URL

- **baseUrl**: `http://localhost:3001` (custom-brain을 같은 머신에서 실행할 때)
- 다른 호스트/포트라면 아래 경로 앞에 해당 baseUrl을 붙여 사용하세요.

## 엔드포인트

### 1. 질의 (ask) — RAG + 자동 메모리

사용자가 "브레인에게 물어봐", "기억한 걸로 답해줘" 등으로 요청할 때 사용합니다.

- **Method**: `POST`
- **URL**: `{baseUrl}/brain/ask`
- **Headers**: `Content-Type: application/json`
- **Body**: `{ "question": "사용자 질문 내용" }`
- **응답**: `{ "answer": "..." }` → `answer` 값을 사용자에게 전달

### 2. 채팅 (chat) — 한 턴 대화

일반적인 한 턴 대화를 브레인에 넘길 때 사용합니다.

- **Method**: `POST`
- **URL**: `{baseUrl}/brain/chat`
- **Headers**: `Content-Type: application/json`
- **Body**: `{ "message": "사용자 메시지" }`
- **응답**: `{ "reply": "...", "memory": { "important", "stored" } }` → `reply` 값을 사용자에게 전달

### 3. 세션 대화 목록 (memory)

현재 세션의 대화 목록을 조회할 때 사용합니다.

- **Method**: `GET`
- **URL**: `{baseUrl}/brain/memory`
- **응답**: `{ "messages": [ { "role", "content" }, ... ] }`

### 4. Agent Tools (메모리·사진·문서 검색, 타임라인, 가족 트리)

OpenClaw 등 에이전트에서 “질문 → 검색 → LLM 답변” 파이프라인을 만들 때 아래 도구를 사용합니다.

| 도구 | Method | URL | Query / Body | 응답 |
|------|--------|-----|--------------|------|
| **searchMemory** | GET | `{baseUrl}/brain/memory/search` | `?q=검색어&limit=5&scope=personal\|family` | `{ "results": [ { "id", "content", "type", "metadata" }, ... ] }` |
| **searchPhotos** | GET | `{baseUrl}/brain/photos/search` | `?q=검색어&limit=5` | `{ "results": [ ... ] }` (사진/이미지 관련 메모리) |
| **searchDocuments** | GET | `{baseUrl}/brain/documents/search` | `?q=검색어&limit=5` | `{ "results": [ ... ] }` (문서 메모리) |
| **timeline** | GET | `{baseUrl}/brain/timeline` | `?scope=personal\|family&limit=50` | `{ "timeline": [ { "date", "description", "memoryId", "type", "scope" }, ... ] }` |
| **familyTree** | GET | `{baseUrl}/brain/family/tree` | - | `{ "tree": [ { "id", "name", "relation", "birthDate?", "description?", "children" }, ... ] }` |

에이전트 흐름 예: 사용자 질문 → 위 도구로 context 수집 → LLM(Ollama 등)에 context + 질문 전달 → 생성된 답변을 사용자에게 반환.

로컬에서 바로 질문→답변을 테스트하려면: **custom-brain 서버**와 **Ollama**를 띄운 뒤 `pnpm run run-agent` 를 실행하세요.

## 사용 시점

- 사용자가 **질문을 “브레인/기억”에 기반해 답해달라고 할 때** → `POST /brain/ask` 사용.
- 사용자가 **단순히 브레인과 대화한 턴을 처리할 때** → `POST /brain/chat` 사용.
- 사용자가 **지금까지 뭐라고 했는지 보고 싶어할 때** → `GET /brain/memory` 사용.
- **에이전트(OpenClaw)** 에서 사진·문서·메모리 검색 후 LLM 답변을 만들 때 → 위 Agent Tools (searchMemory, searchPhotos, searchDocuments, timeline, familyTree) 사용.

## 주의

- custom-brain 서버가 baseUrl에서 실행 중이어야 합니다 (`pnpm run start:dev` 또는 `pnpm run start:prod`).
- HTTP 요청 실패 시(연결 거부, 타임아웃 등) 사용자에게 "브레인 서버에 연결할 수 없습니다" 등으로 안내하세요.
