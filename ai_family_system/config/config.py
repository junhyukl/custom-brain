"""
ai_family_system - Production-grade Face + Voice + Family Graph config.
환경 변수 또는 .env 로 오버라이드. 기본값은 로컬 개발용.
"""
import os
from pathlib import Path

# NestJS custom-brain API (메모리 저장, face match, 그래프 연동 시 사용)
NEST_API_URL = os.environ.get("NEST_API_URL", "http://localhost:3001").rstrip("/")

# Face: Python InsightFace service (검출·임베딩)
FACE_SERVICE_URL = os.environ.get("FACE_SERVICE_URL", "http://localhost:8001").rstrip("/")

# AI: Whisper·embed·relation 추출
AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8000").rstrip("/")

# Neo4j (Family Graph)
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")

# 로컬 전용: 얼굴 DB(pickle), 메모리 DB(SQLite), 녹음 저장 경로
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("AI_FAMILY_DATA_DIR", str(ROOT / "data")))
FACE_DB_PATH = DATA_DIR / "face_db.pkl"
MEMORY_DB_PATH = DATA_DIR / "memory.db"
VOICE_RECORDINGS_DIR = DATA_DIR / "recordings"

# 통합 모드: True면 Nest API + Face/AI 서비스 사용, False면 로컬만
USE_NEST_API = os.environ.get("USE_NEST_API", "true").lower() in ("1", "true", "yes")

# Whisper 모델 (로컬 사용 시)
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")

# 로깅
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
