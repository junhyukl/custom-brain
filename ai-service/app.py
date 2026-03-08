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
# Limit chars to avoid "context length" errors. Env EMBED_MAX_CHARS overrides. Cap 2048 for safety.
_embed_max = os.environ.get("EMBED_MAX_CHARS", "2000")
EMBED_MAX_CHARS = min(2048, max(500, int(_embed_max) if _embed_max.isdigit() else 2000))

# ollama Python client (host via env OLLAMA_HOST)
try:
    import ollama
except Exception:
    ollama = None


class AnalyzePhotoBody(BaseModel):
    path: str = ""


class TranscribeBody(BaseModel):
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
    truncated = text[:EMBED_MAX_CHARS] if len(text) > EMBED_MAX_CHARS else text
    try:
        r = ollama.embeddings(model=EMBED_MODEL, prompt=truncated)
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


# --- Voice: Whisper STT ---
_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        _whisper_model = whisper.load_model(os.environ.get("WHISPER_MODEL", "base"))
    return _whisper_model


def _run_diarization(path: str) -> list[dict]:
    """Optional speaker diarization (pyannote). Requires HUGGINGFACE_TOKEN. Returns [{speaker, start, end}]."""
    token = os.environ.get("HUGGINGFACE_TOKEN") or os.environ.get("PYANNOTE_TOKEN")
    if not token:
        return []
    try:
        from pyannote.audio import Pipeline
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=token,  # pyannote 3.x; huggingface_hub uses token= in newer versions
        )
        diar = pipeline(path)
        segments = []
        for turn, _, speaker in diar.itertracks(yield_label=True):
            segments.append({"speaker": speaker, "start": round(turn.start, 2), "end": round(turn.end, 2)})
        return segments
    except Exception:
        return []


@app.post("/transcribe")
def transcribe(body: TranscribeBody):
    """음성 파일 경로 → Whisper STT → 텍스트. Nest에서 voice 업로드 후 path 전달."""
    path = (body.path or "").strip()
    if not path or not Path(path).exists():
        return {"text": "", "error": "path required and must exist"}
    try:
        model = _get_whisper_model()
        result = model.transcribe(path)
        return {"text": (result.get("text") or "").strip()}
    except Exception as e:
        return {"text": "", "error": str(e)}


@app.post("/transcribe-with-speakers")
def transcribe_with_speakers(body: TranscribeBody):
    """Whisper STT + 선택적 화자 구분(pyannote). HUGGINGFACE_TOKEN 있으면 segments 반환."""
    path = (body.path or "").strip()
    if not path or not Path(path).exists():
        return {"text": "", "segments": [], "error": "path required and must exist"}
    try:
        model = _get_whisper_model()
        result = model.transcribe(path)
        text = (result.get("text") or "").strip()
        segments = _run_diarization(path)
        return {"text": text, "segments": segments}
    except Exception as e:
        return {"text": "", "segments": [], "error": str(e)}


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
