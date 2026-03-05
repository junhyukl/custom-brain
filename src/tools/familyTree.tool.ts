import { Injectable } from '@nestjs/common';
import { FamilyService } from '../brain/family.service';
import type { FamilyTreeEntry } from '../brain/family.service';

@Injectable()
export class FamilyTreeTool {
  name = 'family_tree';
  description = 'Get the family tree (persons and relations)';

  constructor(private readonly family: FamilyService) {}

  async execute(): Promise<FamilyTreeEntry[]> {
    return this.family.getTree();
  }
}
