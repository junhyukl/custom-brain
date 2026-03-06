"""
Custom Brain v2/v3 - AI Service (Python FastAPI).
- v2: Vision caption, Embedding, OCR placeholder
- v3: Clustering, Summarization, Timeline generation
NestJS에서 AI_SERVICE_URL=http://localhost:8000 로 호출.
"""
import os
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Body
from pydantic import BaseModel

app = FastAPI(title="Custom Brain AI Service", version="0.2.0")

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
VISION_MODEL = os.environ.get("VISION_MODEL", "llava")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text")
LLM_MODEL = os.environ.get("LLM_MODEL", "mistral:7b-instruct")

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


# --- v3 Self-Learning ---

class ClusterBody(BaseModel):
    vectors: list[list[float]] = []


class SummarizeBody(BaseModel):
    memories: list[str] = []
    max_tokens: int = 500


class TimelineBody(BaseModel):
    memories: list[str] = []


def _llm_generate(prompt: str, model: str = LLM_MODEL) -> str:
    if not ollama:
        return ""
    try:
        r = ollama.chat(model=model, messages=[{"role": "user", "content": prompt}])
        msg = r.get("message") or {}
        return (msg.get("content") or "").strip()
    except Exception:
        return ""


@app.post("/cluster")
def cluster(body: ClusterBody):
    """v3: KMeans clustering on vectors. Returns cluster label per index."""
    vectors = body.vectors
    if not vectors or not vectors[0]:
        return {"clusters": []}
    try:
        from sklearn.cluster import KMeans
        import numpy as np
        X = np.array(vectors, dtype=np.float64)
        n = min(10, max(2, len(vectors) // 3))
        kmeans = KMeans(n_clusters=n, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
        return {"clusters": labels.tolist(), "n_clusters": n}
    except Exception as e:
        return {"clusters": [], "error": str(e)}


@app.post("/summarize")
def summarize(body: SummarizeBody):
    """v3: LLM으로 메모리 목록 요약."""
    texts = [t.strip() for t in body.memories if t and t.strip()][:50]
    if not texts:
        return {"summary": ""}
    block = "\n".join(f"- {t}" for t in texts)
    prompt = f"""Summarize these memories in a few sentences. Keep key people, places, and events.

Memories:
{block}

Summary:"""
    return {"summary": _llm_generate(prompt)}


@app.post("/timeline")
def timeline(body: TimelineBody):
    """v3: LLM으로 메모리에서 시간순 타임라인 생성."""
    texts = [t.strip() for t in body.memories if t and t.strip()][:80]
    if not texts:
        return {"timeline": ""}
    block = "\n".join(f"- {t}" for t in texts)
    prompt = f"""Create a short chronological timeline from these memories. One line per event with approximate year if possible.

Memories:
{block}

Timeline:"""
    return {"timeline": _llm_generate(prompt)}
