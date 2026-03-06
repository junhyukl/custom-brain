"""
Custom Brain v2 - AI Service (Python FastAPI).
- Vision caption (Ollama llava)
- Embedding (nomic-embed-text)
- OCR placeholder (확장 가능)
NestJS에서 AI_SERVICE_URL=http://localhost:8000 로 호출 시 업로드 파이프라인에서 사용.
"""
import os
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Body
from pydantic import BaseModel

app = FastAPI(title="Custom Brain AI Service", version="0.1.0")

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
VISION_MODEL = os.environ.get("VISION_MODEL", "llava")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text")

# ollama Python client (host via env OLLAMA_HOST)
try:
    import ollama
except Exception:
    ollama = None


class AnalyzePhotoBody(BaseModel):
    path: str = ""


class EmbedBody(BaseModel):
    text: str = ""


def _caption_image(path: str) -> str:
    if not ollama:
        return "(Ollama unavailable)"
    try:
        # vision: chat with image path
        r = ollama.chat(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": "Describe this photo in one or two sentences. Include people, place, and activities if visible.",
                    "images": [path],
                }
            ],
        )
        msg = r.get("message") or {}
        return (msg.get("content") or "").strip()
    except Exception as e:
        return f"(caption error: {e})"


def _embed_text(text: str) -> list[float]:
    if not ollama:
        return []
    try:
        r = ollama.embeddings(model=EMBED_MODEL, prompt=text)
        return list(r.get("embedding") or [])
    except Exception:
        return []


@app.post("/analyze-photo")
async def analyze_photo(
    body: AnalyzePhotoBody | None = None,
    file: UploadFile | None = File(None),
):
    """
    사진 분석: 캡션, 인물(이름은 추후 연동), OCR(플레이스홀더).
    body.path 또는 file 업로드 지원.
    """
    path = ""
    if body and body.path and Path(body.path).exists():
        path = body.path
    elif file:
        # 업로드 파일을 임시 저장 후 경로 전달
        tmp = Path("/tmp") / f"ai_svc_{os.getpid()}_{file.filename or 'img.jpg'}"
        tmp.write_bytes(await file.read())
        path = str(tmp)

    if not path:
        return {"caption": "", "people": [], "ocr": "", "embedding": [], "error": "no path or file"}

    caption = _caption_image(path)
    embedding = _embed_text(caption)
    # people: 추후 face-service 연동 또는 LLM으로 이름 추출 가능
    people: list[str] = []
    ocr = ""

    return {
        "caption": caption,
        "people": people,
        "ocr": ocr,
        "embedding": embedding,
    }


@app.post("/embed")
def embed(body: EmbedBody):
    """텍스트 → 벡터 (nomic-embed-text)."""
    return {"vector": _embed_text(body.text)}


@app.get("/health")
def health():
    return {"status": "ok", "ollama": OLLAMA_HOST}
