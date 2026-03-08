"""
Neo4j Family Graph. Person MERGE, 관계 추가 (FATHER, MOTHER, BROTHER 등).
"""
import os

try:
    from ai_family_system.config.config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
    from ai_family_system.utils.logger import get_logger
except ImportError:
    from config.config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
    from utils.logger import get_logger

logger = get_logger(__name__)

ALLOWED_RELATIONS = frozenset(
    {"FATHER", "MOTHER", "BROTHER", "SISTER", "SON", "DAUGHTER", "SPOUSE", "CHILD", "PARENT"}
)


class FamilyGraph:
    def __init__(self):
        self.driver = None
        uri = os.environ.get("NEO4J_URI") or NEO4J_URI
        if uri:
            try:
                from neo4j import GraphDatabase
                user = os.environ.get("NEO4J_USER") or NEO4J_USER
                password = os.environ.get("NEO4J_PASSWORD") or NEO4J_PASSWORD
                self.driver = GraphDatabase.driver(uri, auth=(user, password))
                self.driver.verify_connectivity()
            except Exception as e:
                logger.warning("Neo4j connect failed: %s", e)
                self.driver = None

    def add_person(self, name: str) -> None:
        if not self.driver or not name or not name.strip():
            return
        with self.driver.session() as session:
            session.run("MERGE (p:Person {name: $name})", name=name.strip())

    def add_relation(self, from_name: str, relation: str, to_name: str) -> None:
        if not self.driver or not from_name or not to_name:
            return
        rel_upper = relation.strip().upper()
        if rel_upper not in ALLOWED_RELATIONS:
            logger.debug("relation not in whitelist: %s", relation)
            return
        with self.driver.session() as session:
            # Cypher: MERGE (a)-[:REL_TYPE]->(b). 동적 관계 타입은 apoc 또는 쿼리 빌드.
            query = (
                "MERGE (a:Person {name: $from_name}) "
                "MERGE (b:Person {name: $to_name}) "
                f"MERGE (a)-[:{rel_upper}]->(b)"
            )
            session.run(query, from_name=from_name.strip(), to_name=to_name.strip())
        logger.info("graph relation: %s -[%s]-> %s", from_name, rel_upper, to_name)

    def close(self) -> None:
        if self.driver:
            self.driver.close()
            self.driver = None
