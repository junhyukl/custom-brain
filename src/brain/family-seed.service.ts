import { Injectable, OnModuleInit } from '@nestjs/common';
import { FamilyService } from './family.service';

/** 시드: Dooboo Lee(myself, 강아지), 엄마 Hwaseong, 아빠 Junhyuk, 형 Will, 누나 Saena */
@Injectable()
export class FamilySeedService implements OnModuleInit {
  constructor(private readonly family: FamilyService) {}

  async onModuleInit(): Promise<void> {
    await this.seedIfEmpty();
  }

  async seedIfEmpty(): Promise<void> {
    const persons = await this.family.listPersons();
    if (persons.length > 0) return;

    const spouse = await this.family.createPerson({
      name: 'Hwaseong Lee',
      relation: 'spouse',
      birthDate: '1971-10-18',
    });
    const me = await this.family.createPerson({
      name: 'Junhyuk Lee',
      relation: 'myself',
      birthDate: '1969-02-02',
    });
    const parentIds = [spouse.id, me.id];

    await this.family.createPerson({
      name: 'Dooboo Lee',
      relation: 'child',
      birthDate: '2016-11-25',
      description: 'dog',
      parentIds,
    });
    await this.family.createPerson({
      name: 'Will Minwoo Lee',
      relation: 'child',
      birthDate: '2004-08-05',
      description: 'son',
      parentIds,
    });
    await this.family.createPerson({
      name: 'Saena Lee',
      relation: 'child',
      birthDate: '2007-05-11',
      description: 'daughter',
      parentIds,
    });

    console.log('[FamilySeed] Seeded family: Dooboo Lee (myself, dog), Hwaseong, Junhyuk, Will Minwoo, Saena');
  }
}
