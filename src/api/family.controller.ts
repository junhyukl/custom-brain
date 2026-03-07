import { Body, Controller, Get, Post } from '@nestjs/common';
import { FamilyService } from '../brain/family.service';
import { CreatePersonDto } from '../brain/dto';
import { toErrorMessage } from '../common/error.util';
import type { FamilyTreeEntry, FamilyGraphResponse } from '../brain/family.service';
import type { Person } from '../schemas';

@Controller('brain')
export class FamilyController {
  constructor(private readonly family: FamilyService) {}

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
    return this.family.createPerson(body);
  }
}
