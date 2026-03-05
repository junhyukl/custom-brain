import { Injectable } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { ObjectId } from 'mongodb';
import type { Person, PersonRelation } from '../brain-schema';

export interface FamilyTreeEntry {
  id: string;
  name: string;
  relation: PersonRelation;
  birthDate?: string;
  description?: string;
  children: FamilyTreeEntry[];
}

@Injectable()
export class FamilyService {
  constructor(private readonly mongo: MongoService) {}

  async createPerson(data: {
    name: string;
    relation: PersonRelation;
    birthDate?: string;
    description?: string;
    parentIds?: string[];
  }): Promise<Person> {
    const id = new ObjectId().toHexString();
    const doc: Person = {
      id,
      name: data.name,
      relation: data.relation,
      birthDate: data.birthDate,
      description: data.description,
      parentIds: data.parentIds ?? [],
    };
    await this.mongo.getPersonCollection().insertOne(doc);
    return doc;
  }

  async listPersons(): Promise<Person[]> {
    return this.mongo.getPersonCollection().find({}).toArray();
  }

  async getTree(): Promise<FamilyTreeEntry[]> {
    const persons = await this.listPersons();
    const roots = persons.filter((p) => !p.parentIds?.length);
    const toEntry = (p: Person): FamilyTreeEntry => ({
      id: p.id,
      name: p.name,
      relation: p.relation,
      birthDate: p.birthDate,
      description: p.description,
      children: persons
        .filter((c) => c.parentIds?.includes(p.id))
        .map(toEntry),
    });
    return roots.map(toEntry);
  }

  async getPerson(id: string): Promise<Person | null> {
    return this.mongo.getPersonCollection().findOne({ id });
  }
}
