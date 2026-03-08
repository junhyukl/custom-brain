import { Body, Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';
import { FamilyService } from '../brain/family.service';
import { FamilyGraphService } from '../neo4j/family-graph.service';
import { CreatePersonDto } from '../brain/dto';
import { toErrorMessage } from '../common/error.util';
import type { FamilyTreeEntry, FamilyGraphResponse } from '../brain/family.service';
import type { Person } from '../schemas';

@Controller('brain')
export class FamilyController {
  constructor(
    private readonly family: FamilyService,
    private readonly familyGraph: FamilyGraphService,
  ) {}

  @Get('family/graph')
  async getGraph(): Promise<{ graph: FamilyGraphResponse; error?: string }> {
    try {
      const graph = await this.family.getGraph();
      return { graph };
    } catch (err) {
      const message = toErrorMessage(err);
      return { graph: { nodes: [], edges: [] }, error: message };
    }
  }

  @Get('family/tree')
  async getTree(): Promise<{ tree: FamilyTreeEntry[]; error?: string }> {
    try {
      const tree = await this.family.getTree();
      return { tree };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/family/tree]', message);
      return { tree: [], error: message };
    }
  }

  @Post('family/persons')
  async createPerson(@Body() body: CreatePersonDto): Promise<Person> {
    try {
      return await this.family.createPerson(body);
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/family/persons]', message);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** Voice 추론 등으로 가족 관계 추가. (Person)-[:relation]->(Person). ai_family_system 연동. */
  @Post('family/graph/relation')
  async addGraphRelation(
    @Body() body: { from?: string; relation?: string; to?: string },
  ): Promise<{ ok: boolean; error?: string }> {
    const fromName = body?.from?.trim();
    const toName = body?.to?.trim();
    const relation = body?.relation?.trim();
    if (!fromName || !toName || !relation) {
      return { ok: false, error: 'from, relation, to required' };
    }
    try {
      await this.familyGraph.addRelation(fromName, relation, toName);
      return { ok: true };
    } catch (err) {
      const message = toErrorMessage(err);
      return { ok: false, error: message };
    }
  }
}
