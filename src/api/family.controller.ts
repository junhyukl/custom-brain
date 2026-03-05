import { Body, Controller, Get, Post } from '@nestjs/common';
import { FamilyService } from '../brain/family.service';
import { CreatePersonDto } from '../brain/dto';
import type { FamilyTreeEntry } from '../brain/family.service';
import type { Person } from '../brain-schema';

@Controller('brain')
export class FamilyController {
  constructor(private readonly family: FamilyService) {}

  @Get('family/tree')
  async getTree(): Promise<{ tree: FamilyTreeEntry[] }> {
    const tree = await this.family.getTree();
    return { tree };
  }

  @Post('family/persons')
  async createPerson(@Body() body: CreatePersonDto): Promise<Person> {
    return this.family.createPerson(body);
  }
}
