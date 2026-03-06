# AI Service (Custom Brain v2)

NestJS 업로드 파이프라인에서 사용하는 통합 AI 서비스 (FastAPI).

- **Vision caption**: Ollama `llava`로 사진 설명
- **Embedding**: `nomic-embed-text`로 텍스트 → 벡터
- **OCR**: 플레이스홀더 (추후 확장)

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
| GET | `/health` | 상태 확인 |

## NestJS 연동

`AI_SERVICE_URL=http://localhost:8000` 로 설정하면 사진 업로드 시 이 서비스로 캡션·임베딩을 받아 Vector DB + Timeline + Family graph에 반영합니다.
