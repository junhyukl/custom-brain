import { Injectable } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';

/**
 * v3: Knowledge Graph (Neo4j). Entity 노드와 RELATED_TO 관계.
 * Brain organize 시 메모리에서 추출한 엔티티/관계를 저장.
 */
@Injectable()
export class KnowledgeGraphService {
  constructor(private readonly neo4j: Neo4jService) {}

  /** 두 엔티티를 노드로 만들고 RELATED_TO 관계 생성. */
  async linkKnowledge(a: string, b: string): Promise<void> {
    if (!this.neo4j.isAvailable()) return;
    const nameA = (a || '').trim();
    const nameB = (b || '').trim();
    if (!nameA || !nameB || nameA === nameB) return;
    try {
      await this.neo4j.run(
        `
        MERGE (a:Entity {name: $a})
        MERGE (b:Entity {name: $b})
        MERGE (a)-[:RELATED_TO]->(b)
        `,
        { a: nameA, b: nameB },
      );
    } catch {
      // ignore
    }
  }

  /** 엔티티 이름 목록을 그래프에 반영 (연속된 쌍으로 link). */
  async linkEntities(names: string[]): Promise<void> {
    const trimmed = names.map((n) => (n || '').trim()).filter(Boolean);
    for (let i = 0; i < trimmed.length - 1; i++) {
      await this.linkKnowledge(trimmed[i], trimmed[i + 1]);
    }
  }
}
