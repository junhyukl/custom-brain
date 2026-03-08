"""
얼굴 인식: 검출된 임베딩으로 인물 식별.
- NEST_API_URL 설정 시: POST /brain/face/match 로 매칭 (Qdrant 기반).
- 없으면 로컬 face_db.pkl (face_database) 사용.
"""
import os
from typing import Optional

try:
    from ai_family_system.utils.logger import get_logger
except ImportError:
    from utils.logger import get_logger

logger = get_logger(__name__)


def recognize_from_embedding(embedding: list[float]) -> Optional[tuple[str, str]]:
    """
    단일 임베딩 → (personId, personName) 또는 None.
    Nest API 사용 시 /brain/face/match 호출.
    """
    url = os.environ.get("NEST_API_URL", "").rstrip("/")
    if url:
        try:
            import requests
            r = requests.post(
                f"{url}/brain/face/match",
                json={"embedding": embedding},
                timeout=10,
            )
            if r.ok:
                data = r.json()
                if data.get("personId") and data.get("personName"):
                    return (data["personId"], data["personName"])
        except Exception as e:
            logger.warning("Nest face/match failed: %s", e)
        return None
    # 로컬: face_database 사용
    try:
        try:
            from ai_family_system.face.face_database import FaceDatabase
        except ImportError:
            from face.face_database import FaceDatabase
        db = FaceDatabase()
        return db.find_person(embedding)
    except Exception as e:
        logger.debug("local face_database: %s", e)
    return None


def recognize_from_image_path(image_path: str) -> list[str]:
    """
    이미지 경로 → 검출 후 매칭 → 인물 이름 목록.
    """
    try:
        from ai_family_system.face.face_detect import detect_from_path
    except ImportError:
        from face.face_detect import detect_from_path
    faces = detect_from_path(image_path)
    names = []
    for face in faces:
        emb = face.get("embedding")
        if not emb:
            continue
        match = recognize_from_embedding(emb)
        if match:
            _, name = match
            names.append(name)
        else:
            names.append("Unknown")
    return names
