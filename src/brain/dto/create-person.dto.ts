import type { PersonRelation } from '../../brain-schema';

export class CreatePersonDto {
  name!: string;
  relation!: PersonRelation;
  birthDate?: string;
  description?: string;
  parentIds?: string[];
}
