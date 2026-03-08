"""
ai_family_system - 공통 로거. config.LOG_LEVEL 반영.
"""
import logging
import sys

try:
    from ai_family_system.config.config import LOG_LEVEL
except ImportError:
    from config.config import LOG_LEVEL

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
        logger.addHandler(handler)
        logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
    return logger
