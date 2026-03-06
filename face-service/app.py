"""
Face detection + embedding (InsightFace).
NestJS custom-brain에서 FACE_SERVICE_URL=http://localhost:8001 로 호출.
"""
from fastapi import FastAPI, UploadFile
import cv2
import numpy as np

app = FastAPI(title="Face Service", version="0.1.0")

# InsightFace 로드는 첫 요청 시 또는 startup 시
_model = None

def get_model():
    global _model
    if _model is None:
        from insightface.app import FaceAnalysis
        _model = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        _model.prepare(ctx_id=0)
    return _model

@app.post("/detect")
async def detect(file: UploadFile):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"faces": [], "error": "invalid image"}

    model = get_model()
    faces = model.get(img)
    results = []
    for face in faces:
        results.append({
            "embedding": face.embedding.tolist(),
            "bbox": face.bbox.tolist(),
        })
    return {"faces": results}

@app.get("/health")
async def health():
    return {"status": "ok"}
