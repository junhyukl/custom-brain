"""
Speech → Text. AI_SERVICE_URL 있으면 /transcribe 호출, 없으면 로컬 Whisper.
"""
import os
from pathlib import Path

try:
    from ai_family_system.config.config import AI_SERVICE_URL, WHISPER_MODEL
    from ai_family_system.utils.logger import get_logger
except ImportError:
    from config.config import AI_SERVICE_URL, WHISPER_MODEL
    from utils.logger import get_logger

logger = get_logger(__name__)

_whisper_model = None


def _get_whisper():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        _whisper_model = whisper.load_model(os.environ.get("WHISPER_MODEL", WHISPER_MODEL))
    return _whisper_model


def transcribe(audio_path: str) -> str:
    """음성 파일 경로 → 텍스트."""
    if not audio_path or not Path(audio_path).exists():
        return ""
    url = (os.environ.get("AI_SERVICE_URL") or AI_SERVICE_URL or "").rstrip("/")
    if url:
        try:
            import requests
            r = requests.post(f"{url}/transcribe", json={"path": audio_path}, timeout=120)
            if r.ok:
                data = r.json()
                return (data.get("text") or "").strip()
        except Exception as e:
            logger.warning("ai-service transcribe failed: %s", e)
    try:
        model = _get_whisper()
        result = model.transcribe(audio_path)
        return (result.get("text") or "").strip()
    except Exception as e:
        logger.warning("local Whisper failed: %s", e)
    return ""
