import { Injectable } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';

/**
 * v2: Neo4j Family Graph. NEO4J_URI 설정 시 Person 노드를 Neo4j에 MERGE.
 * MongoDB FamilyService와 병행 사용 가능 (Mongo: 메인, Neo4j: 그래프 쿼리/시각화용).
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
}
