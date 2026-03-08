"""
Voice → Memory 저장 + Family Graph 관계 추론·연결.
- Nest API 사용 시: POST /brain/upload/voice (파일) 또는 POST /brain/memory + 관계 추출 API.
- 로컬 시: memory_store.save + family_graph.add_relation (텍스트에서 관계 추론).
"""
import os
import re
from datetime import datetime

try:
    from ai_family_system.config.config import NEST_API_URL
    from ai_family_system.utils.logger import get_logger
except ImportError:
    from config.config import NEST_API_URL
    from utils.logger import get_logger

logger = get_logger(__name__)

# 관계 키워드 (한/영) → Neo4j 관계 타입
RELATION_PATTERNS = [
    (re.compile(r"(?:my\s+)?father\s+is\s+(\w+)", re.I), "FATHER"),
    (re.compile(r"(?:my\s+)?mother\s+is\s+(\w+)", re.I), "MOTHER"),
    (re.compile(r"(?:my\s+)?(?:older\s+)?brother\s+is\s+(\w+)", re.I), "BROTHER"),
    (re.compile(r"(?:my\s+)?(?:older\s+)?sister\s+is\s+(\w+)", re.I), "SISTER"),
    (re.compile(r"(?:아버지|爸爸)\s*[는은이가]?\s*(\S+)", re.I), "FATHER"),
    (re.compile(r"(?:어머니|엄마|妈妈)\s*[는은이가]?\s*(\S+)", re.I), "MOTHER"),
    (re.compile(r"(\w+)\s+is\s+my\s+father", re.I), "FATHER"),  # Mike is my father → speaker FATHER Mike
    (re.compile(r"(\w+)\s+is\s+my\s+mother", re.I), "MOTHER"),
    (re.compile(r"(\w+)\s+is\s+my\s+brother", re.I), "BROTHER"),
    (re.compile(r"(\w+)\s+is\s+my\s+sister", re.I), "SISTER"),
]


def extract_relations_from_text(speaker: str, text: str) -> list[tuple[str, str, str]]:
    """
    텍스트에서 (speaker, relation_type, other_name) 추출.
    반환: [(from_person, relation, to_person), ...]
    """
    relations = []
    for pattern, rel_type in RELATION_PATTERNS:
        for m in pattern.finditer(text):
            name = m.group(1).strip()
            if not name or name.lower() in ("unknown", "my", "is"):
                continue
            # "X is my father" 패턴이면 speaker -> X 가 아니라 X가 father 역할; 화자는 speaker이므로 speaker -[FATHER]-> X (화자의 아버지가 X)
            if "is my" in pattern.pattern:
                relations.append((speaker, rel_type, name))
            else:
                # "my father is X" → speaker -[FATHER]-> X
                relations.append((speaker, rel_type, name))
    return relations


def process_voice(speaker: str, text: str, audio_path: str = "") -> bool:
    """
    음성 메모리 저장 + 관계 추론 후 Family Graph 업데이트.
    Nest API 사용 시: 메모리 저장은 업로드 플로우에서 이미 하므로, 여기서는 관계만 추출해 Graph API 호출.
    """
    if not text or not text.strip():
        return False
    speaker = (speaker or "Unknown").strip()
    url = (os.environ.get("NEST_API_URL") or NEST_API_URL or "").rstrip("/")
    if url:
        try:
            import requests
            # 메모리 저장 (간단히 POST /brain/memory)
            requests.post(
                f"{url}/brain/memory",
                json={
                    "content": text,
                    "type": "voice",
                    "metadata": {"speaker": speaker, "filePath": audio_path or None},
                },
                timeout=10,
            )
            # 관계 추출 후 Nest API (추후 /brain/family/graph/relation 추가 시)
            relations = extract_relations_from_text(speaker, text)
            for from_name, rel_type, to_name in relations:
                try:
                    requests.post(
                        f"{url}/brain/family/graph/relation",
                        json={"from": from_name, "relation": rel_type, "to": to_name},
                        timeout=5,
                    )
                except Exception as e:
                    logger.debug("graph relation post: %s", e)
        except Exception as e:
            logger.warning("Nest memory/graph failed: %s", e)
            return False
        return True
    # 로컬: memory_store + family_graph
    try:
        from ai_family_system.memory.memory_store import MemoryStore
        from ai_family_system.family_graph.graph_db import FamilyGraph
        store = MemoryStore()
        graph = FamilyGraph()
        store.save(speaker, text)
        relations = extract_relations_from_text(speaker, text)
        for from_name, rel_type, to_name in relations:
            graph.add_relation(from_name, rel_type, to_name)
    except Exception as e:
        logger.warning("local memory/graph: %s", e)
        return False
    return True
