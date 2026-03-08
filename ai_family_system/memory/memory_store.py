"""
메모리 저장. Nest API 사용 시 HTTP, 로컬 시 SQLite.
"""
import sqlite3
from datetime import datetime
from pathlib import Path

import os

try:
    from ai_family_system.config.config import NEST_API_URL, MEMORY_DB_PATH
    from ai_family_system.utils.logger import get_logger
except ImportError:
    from config.config import NEST_API_URL, MEMORY_DB_PATH
    from utils.logger import get_logger

logger = get_logger(__name__)


class MemoryStore:
    def __init__(self, db_path: Path | None = None):
        self.db_path = db_path or MEMORY_DB_PATH
        self._conn: sqlite3.Connection | None = None
        if not (os.environ.get("NEST_API_URL") or str(NEST_API_URL)):
            self._ensure_db()

    def _ensure_db(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(self.db_path))
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person TEXT NOT NULL,
                text TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
            """
        )
        self._conn.commit()

    def save(self, person: str, text: str) -> None:
        if self._conn is None:
            return
        self._conn.execute(
            "INSERT INTO memory (person, text, timestamp) VALUES (?, ?, ?)",
            (person.strip(), text.strip(), datetime.utcnow().isoformat()),
        )
        self._conn.commit()
        logger.info("memory saved: person=%s len=%d", person, len(text))

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None
