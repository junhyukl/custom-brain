import { Module } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { FamilyGraphService } from './family-graph.service';

@Module({
  providers: [Neo4jService, FamilyGraphService],
  exports: [Neo4jService, FamilyGraphService],
})
export class Neo4jModule {}
