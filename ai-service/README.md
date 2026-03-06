# AI Service (Custom Brain v2 / v3)

NestJS 업로드 파이프라인 및 v3 Self-Learning에서 사용하는 통합 AI 서비스 (FastAPI).

- **v2**: Vision caption (llava), Embedding (nomic-embed-text), OCR 플레이스홀더
- **v3**: Clustering (KMeans), Summarization, Timeline generation (Ollama LLM)

## 설치 및 실행

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

환경 변수: `OLLAMA_HOST`, `VISION_MODEL`, `EMBED_MODEL` (기본값: llava, nomic-embed-text)

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/analyze-photo` | `{ "path": "/abs/path" }` 또는 multipart `file` → caption, people, ocr, embedding |
| POST | `/embed` | `{ "text": "..." }` → `{ "vector": number[] }` |
| POST | `/cluster` | v3 `{ "vectors": number[][] }` → `{ "clusters": number[] }` |
| POST | `/summarize` | v3 `{ "memories": string[] }` → `{ "summary": string }` |
| POST | `/timeline` | v3 `{ "memories": string[] }` → `{ "timeline": string }` |
| GET | `/health` | 상태 확인 |

## NestJS 연동

`AI_SERVICE_URL=http://localhost:8000` 로 설정하면 사진 업로드 시 이 서비스로 캡션·임베딩을 받아 Vector DB + Timeline + Family graph에 반영합니다.
