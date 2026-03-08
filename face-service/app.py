"""
Face detection + embedding (InsightFace). Production-grade pipeline.
NestJS custom-brain에서 FACE_SERVICE_URL=http://localhost:8001 로 호출.
- /detect: multipart file (기존 호환)
- /analyze-face: body {"path": "..."} 로컬 경로 (동일 호스트/공유 볼륨용, 대용량 시 유리)
"""
import os
from pathlib import Path

from fastapi import FastAPI, UploadFile
from pydantic import BaseModel
import cv2
import numpy as np

app = FastAPI(title="Face Service", version="0.2.0")

# InsightFace 로드는 첫 요청 시. GPU: INSIGHTFACE_GPU=1 이면 CUDA 시도
_model = None

def get_model():
    global _model
    if _model is None:
        from insightface.app import FaceAnalysis
        providers = ["CPUExecutionProvider"]
        if os.environ.get("INSIGHTFACE_GPU", "").lower() in ("1", "true", "yes"):
            providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        _model = FaceAnalysis(name="buffalo_l", providers=providers)
        _model.prepare(ctx_id=0)
    return _model


class AnalyzeFaceBody(BaseModel):
    path: str = ""


def _faces_from_image(img) -> list[dict]:
    if img is None:
        return []
    model = get_model()
    faces = model.get(img)
    return [
        {"embedding": f.embedding.tolist(), "bbox": f.bbox.tolist()}
        for f in faces
    ]


@app.post("/detect")
async def detect(file: UploadFile):
    """Multipart file 업로드 → 얼굴 검출 + 임베딩 (기존 호환)."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"faces": [], "error": "invalid image"}
    return {"faces": _faces_from_image(img)}


@app.post("/analyze-face")
async def analyze_face(body: AnalyzeFaceBody):
    """로컬 파일 경로로 분석 (동일 호스트/공유 볼륨). 대용량·스트리밍에 유리."""
    path = (body.path or "").strip()
    if not path or not Path(path).exists():
        return {"faces": [], "error": "path required and must exist"}
    img = cv2.imread(path)
    if img is None:
        return {"faces": [], "error": "invalid image or path"}
    return {"faces": _faces_from_image(img)}


@app.get("/health")
async def health():
    return {"status": "ok"}
