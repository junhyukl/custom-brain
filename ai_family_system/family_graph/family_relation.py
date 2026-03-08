"""
가족 관계 추론·조회. graph_db 래퍼 + 관계 추출 규칙.
"""
from .graph_db import FamilyGraph, ALLOWED_RELATIONS

__all__ = ["FamilyGraph", "ALLOWED_RELATIONS"]
