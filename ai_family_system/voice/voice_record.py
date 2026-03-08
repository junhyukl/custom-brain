"""
음성 녹음. sounddevice 사용. 저장 경로는 config.VOICE_RECORDINGS_DIR.
"""
import time
from pathlib import Path

try:
    from ai_family_system.config.config import VOICE_RECORDINGS_DIR
    from ai_family_system.utils.logger import get_logger
except ImportError:
    from config.config import VOICE_RECORDINGS_DIR
    from utils.logger import get_logger

logger = get_logger(__name__)

SAMPLE_RATE = 44100
CHANNELS = 1


def record_audio(filename: str = "voice.wav", duration_sec: float = 5) -> str:
    """duration_sec 초 녹음 후 파일 저장. 반환: 저장된 파일 경로."""
    try:
        import sounddevice as sd
        from scipy.io.wavfile import write
    except ImportError:
        logger.warning("sounddevice/scipy not installed; skipping record")
        return ""

    VOICE_RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
    path = VOICE_RECORDINGS_DIR / filename
    if not path.suffix:
        path = path.with_suffix(".wav")

    logger.info("Recording %s s...", duration_sec)
    recording = sd.rec(
        int(duration_sec * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype="float32",
    )
    sd.wait()
    write(str(path), SAMPLE_RATE, recording)
    logger.info("Saved: %s", path)
    return str(path)
