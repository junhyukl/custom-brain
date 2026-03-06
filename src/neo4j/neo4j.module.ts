import { Module } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { FamilyGraphService } from './family-graph.service';
import { KnowledgeGraphService } from './knowledge-graph.service';

@Module({
  providers: [Neo4jService, FamilyGraphService, KnowledgeGraphService],
  exports: [Neo4jService, FamilyGraphService, KnowledgeGraphService],
})
export class Neo4jModule {}
