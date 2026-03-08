"""
얼굴 검출 + 임베딩. FACE_SERVICE_URL 있으면 InsightFace 서비스 호출, 없으면 로컬 face_recognition 사용.
"""
import os
from pathlib import Path

try:
    from ai_family_system.utils.logger import get_logger
except ImportError:
    from utils.logger import get_logger

logger = get_logger(__name__)

def detect_from_path(image_path: str) -> list[dict]:
    """이미지 경로 → [{ embedding, bbox }]. 서비스 사용 시 path 전달로 효율적."""
    url = os.environ.get("FACE_SERVICE_URL", "").rstrip("/")
    if url:
        try:
            import requests
            r = requests.post(f"{url}/analyze-face", json={"path": image_path}, timeout=30)
            if r.ok:
                data = r.json()
                return data.get("faces") or []
        except Exception as e:
            logger.warning("face-service analyze-face failed: %s", e)
    # Fallback: 로컬 (buffer 기반은 voice_record 연동 시 사용)
    return []


def detect_from_buffer(buffer: bytes, filename: str = "photo.jpg") -> list[dict]:
    """이미지 바이트 → [{ embedding, bbox }]. multipart로 face-service /detect 호출."""
    url = os.environ.get("FACE_SERVICE_URL", "").rstrip("/")
    if url:
        try:
            import requests
            files = {"file": (filename, buffer, "image/jpeg")}
            r = requests.post(f"{url}/detect", files=files, timeout=30)
            if r.ok:
                data = r.json()
                return data.get("faces") or []
        except Exception as e:
            logger.warning("face-service detect failed: %s", e)
    return []
