import type { PersonRelation } from '../../schemas';

export class CreatePersonDto {
  name!: string;
  relation!: PersonRelation;
  birthDate?: string;
  description?: string;
  parentIds?: string[];
}
