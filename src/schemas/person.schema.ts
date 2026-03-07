export type PersonRelation =
  | 'father'
  | 'mother'
  | 'grandfather'
  | 'grandmother'
  | 'child'
  | 'spouse'
  | 'sibling';

export interface Person {
  id: string;
  name: string;
  relation: PersonRelation;
  birthDate?: string;
  description?: string;
  parentIds?: string[];
}
