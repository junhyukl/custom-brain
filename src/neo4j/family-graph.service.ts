import { Injectable } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';

/**
 * Neo4j Family + Memory Graph. NEO4J_URI 설정 시 Person·Memory 노드 및 관계 저장.
 * - Person -[:APPEARS_IN]-> Memory (photo): 사진에 등장한 인물
 * - Person -[:SPOKE]-> Memory (voice): 음성 기록 화자
 * MongoDB FamilyService와 병행 사용 (Mongo: 메인, Neo4j: 그래프 쿼리/시각화).
 */
@Injectable()
export class FamilyGraphService {
  constructor(private readonly neo4j: Neo4jService) {}

  /** 인물 이름 목록을 Neo4j Person 노드로 보장 (MERGE). */
  async updatePeople(people: string[]): Promise<void> {
    if (!this.neo4j.isAvailable()) return;
    for (const name of people) {
      if (!name?.trim()) continue;
      try {
        await this.neo4j.run(
          `MERGE (p:Person {name: $name}) RETURN p`,
          { name: name.trim() },
        );
      } catch {
        // ignore per-name errors
      }
    }
  }

  /** 사진 메모리와 인물 연결: (Person)-[:APPEARS_IN]->(Memory). */
  async linkPersonToPhoto(personName: string, memoryId: string): Promise<void> {
    if (!this.neo4j.isAvailable() || !personName?.trim() || !memoryId) return;
    try {
      await this.neo4j.run(
        `MERGE (p:Person {name: $personName})
         MERGE (m:Memory {id: $memoryId})
         ON CREATE SET m.type = 'photo'
         MERGE (p)-[:APPEARS_IN]->(m)`,
        { personName: personName.trim(), memoryId },
      );
    } catch {
      // ignore
    }
  }

  /** 음성 메모리와 화자 연결: (Person)-[:SPOKE]->(Memory). */
  async linkPersonToVoice(personName: string, memoryId: string): Promise<void> {
    if (!this.neo4j.isAvailable() || !personName?.trim() || !memoryId) return;
    try {
      await this.neo4j.run(
        `MERGE (p:Person {name: $personName})
         MERGE (m:Memory {id: $memoryId})
         ON CREATE SET m.type = 'voice'
         MERGE (p)-[:SPOKE]->(m)`,
        { personName: personName.trim(), memoryId },
      );
    } catch {
      // ignore
    }
  }

  /** 허용된 가족 관계 타입 (Voice 추론 등). */
  static readonly ALLOWED_RELATIONS = new Set([
    'FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'SON', 'DAUGHTER', 'SPOUSE', 'CHILD', 'PARENT',
  ]);

  /** (Person)-[:RELATION]->(Person) 추가. relationType는 화이트리스트만 허용. */
  async addRelation(fromName: string, relationType: string, toName: string): Promise<void> {
    if (!this.neo4j.isAvailable() || !fromName?.trim() || !toName?.trim()) return;
    const rel = relationType?.trim().toUpperCase();
    if (!rel || !FamilyGraphService.ALLOWED_RELATIONS.has(rel)) return;
    try {
      await this.neo4j.run(
        `MERGE (a:Person {name: $fromName})
         MERGE (b:Person {name: $toName})
         MERGE (a)-[:${rel}]->(b)`,
        { fromName: fromName.trim(), toName: toName.trim() },
      );
    } catch {
      // ignore
    }
  }
}
