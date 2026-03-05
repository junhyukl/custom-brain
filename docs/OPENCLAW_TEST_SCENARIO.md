# OpenClaw 대화형 테스트 시나리오

Family Brain을 **완전 실행**한 뒤, 아래 순서대로 질문하면 OpenClaw Agent와 동일한 API로 동작을 확인할 수 있습니다.

## 사전 준비

1. **서버 + Qdrant + Ollama 실행**
   ```bash
   # 터미널 1: Qdrant
   docker run -d --name qdrant -p 6333:6333 qdrant/qdrant

   # 터미널 2: Ollama (이미 설치된 경우)
   ollama serve
   ollama pull mistral:7b-instruct

   # 터미널 3: Brain 서버
   cd custom-brain && pnpm run start:dev
   ```

2. **샘플 데이터 준비 (둘 중 하나)**
   - **방법 A (네트워크 없이)**: `pnpm run sample:seed` → 최소 시드 이미지 3장 + 문서 2개 생성
   - **방법 B (실제 사진/이미지)**: `pnpm run sample:download` → Picsum에서 이미지 3장 다운로드

3. **메모리에 로드**
   - **UI**: 브라우저에서 http://localhost:3001/ 열기 → **「샘플 데이터 로드」** 클릭
   - **CLI**: `pnpm run family:init` (서버가 떠 있는 상태에서)

---

## 대화형 시나리오 (4단계)

| Step | 사용자 질문 (OpenClaw에서 보낼 메시지) | 기대 동작 |
|------|----------------------------------------|-----------|
| 1 | `할아버지 이야기 알려줘` | 할아버지 출생(1940, 서울) 등 family_texts 기반 답변 |
| 2 | `할머니 여행 사진 보여줘` | 1975 설악산 여행 관련 메모리 + 사진/문서 검색 결과 |
| 3 | `엄마 아빠 출생 이야기 알려줘` | 엄마(1970 부산), 아빠(1968 대구) 등 요약 |
| 4 | `1975년 가족 여행 이야기` | 설악산, 가족 여행 일기 등 검색·요약 |

---

## 자동 실행 스크립트

위 시나리오를 자동으로 돌리려면 (서버 + 샘플 로드 완료 후):

```bash
node scripts/openclaw-demo.js
```

환경 변수로 서버 주소 변경 가능:

```bash
BRAIN_URL=http://localhost:3001 node scripts/openclaw-demo.js
```

---

## OpenClaw Agent에서 호출 예시

Agent가 사용자에게 받은 메시지를 그대로 `question`으로 넘기면 됩니다.

```javascript
// Agent 툴/함수
async function queryFamilyBrain(question) {
  const res = await fetch("http://localhost:3001/brain/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  return data.answer;
}

// 사용자: "할머니 여행 사진 보여줘"
const answer = await queryFamilyBrain("할머니 여행 사진 보여줘");
```

자세한 연동 방법: [openclaw-family.md](openclaw-family.md)
