export class BrainQueryDto {
  type!: 'ask' | 'mongo' | 'code';
  question!: string;
}
