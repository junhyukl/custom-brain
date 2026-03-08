"""
로컬 얼굴 DB (pickle). Nest API 미사용 시 known encodings/names 저장.
InsightFace 임베딩 또는 face_recognition 인코딩 지원.
"""
import pickle
from pathlib import Path
from typing import Optional

try:
    from ai_family_system.config.config import FACE_DB_PATH
    from ai_family_system.utils.logger import get_logger
except ImportError:
    from config.config import FACE_DB_PATH
    from utils.logger import get_logger

logger = get_logger(__name__)

# 유사도 임계값 (코사인/유클리드에 따라 조정)
MATCH_THRESHOLD = 0.6


class FaceDatabase:
    def __init__(self, path: Optional[Path] = None):
        self.path = path or FACE_DB_PATH
        self.encodings: list[list[float]] = []
        self.names: list[str] = []
        self._load()

    def _load(self) -> None:
        if self.path.exists():
            try:
                with open(self.path, "rb") as f:
                    data = pickle.load(f)
                self.encodings = data.get("encodings", [])
                self.names = data.get("names", [])
            except Exception as e:
                logger.warning("face_db load failed: %s", e)

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "wb") as f:
            pickle.dump({"encodings": self.encodings, "names": self.names}, f)

    def find_person(self, embedding: list[float]) -> Optional[tuple[str, str]]:
        """가장 유사한 인물 반환 (personId 대신 name 두 번). 임베딩 차원 일치 가정."""
        if not self.encodings:
            return None
        import math
        best_idx = -1
        best_score = -1.0
        for i, enc in enumerate(self.encodings):
            if len(enc) != len(embedding):
                continue
            # 코사인 유사도
            dot = sum(a * b for a, b in zip(enc, embedding))
            norm_a = math.sqrt(sum(a * a for a in enc))
            norm_b = math.sqrt(sum(b * b for b in embedding))
            if norm_a * norm_b <= 0:
                continue
            score = dot / (norm_a * norm_b)
            if score > best_score:
                best_score = score
                best_idx = i
        if best_idx >= 0 and best_score >= MATCH_THRESHOLD:
            name = self.names[best_idx]
            return (name, name)
        return None

    def add_face(self, embedding: list[float], name: str) -> None:
        self.encodings.append(embedding)
        self.names.append(name)
        self.save()
