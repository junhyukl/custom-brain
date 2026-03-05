# OpenClaw Agent × Family Brain 연동

Family Brain 서버를 OpenClaw Agent에서 **자연어 질문**으로 호출하는 예제입니다.

## 전제

- Brain 서버 실행 중 (기본 `http://localhost:3001`)
- 가족 데이터 초기화 완료: `pnpm run family:init` 또는 `curl -X POST http://localhost:3001/brain/family/initialize`

## Agent에서 호출

```javascript
const BRAIN_URL = process.env.BRAIN_URL || "http://localhost:3001";

async function queryFamilyBrain(question) {
  const res = await fetch(`${BRAIN_URL}/brain/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Brain API ${res.status}`);
  return res.json();
}

// 사용
const { answer } = await queryFamilyBrain("할머니 여행 사진 보여줘");
console.log(answer);
```

## 통합 쿼리 (ask / mongo / code)

OpenClaw의 `queryBrain(type, question)` 형태로 쓰려면:

```javascript
async function queryBrain(type, question) {
  const res = await fetch(`${BRAIN_URL}/brain/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, question }),
  });
  if (!res.ok) throw new Error(`Brain API ${res.status}`);
  return res.json();
}

// 가족 질의는 type "ask"
const data = await queryBrain("ask", "할아버지 출생 이야기 알려줘");
console.log(data.answer);
```

## CLI에서 바로 테스트

```bash
# 서버 실행 후
pnpm run family:query "할머니 여행 사진 보여줘"

# 또는
node scripts/query-family-brain.js "할아버지 이야기 알려줘"
```

환경 변수 `BRAIN_URL`으로 서버 주소 변경 가능 (기본 `http://localhost:3001`).
