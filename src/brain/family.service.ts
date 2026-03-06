import { Injectable } from '@nestjs/common';
import { MongoService, type GraphEdge } from '../mongo/mongo.service';
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

export interface FamilyGraphResponse {
  nodes: Array<{ id: string; name: string; type: 'person' }>;
  edges: Array<{ from: string; to: string; relation: string; photoPath?: string }>;
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

  /** 사진에 함께 등장한 두 인물을 그래프에 연결 */
  async addPhotoTogetherEdge(personId1: string, personId2: string, photoPath: string): Promise<void> {
    if (personId1 === personId2) return;
    const edges = this.mongo.getGraphEdgesCollection();
    const existing = await edges.findOne({
      $or: [
        { from: personId1, to: personId2, type: 'photo_together' },
        { from: personId2, to: personId1, type: 'photo_together' },
      ],
    });
    if (existing) return;
    await edges.insertOne({
      from: personId1,
      to: personId2,
      type: 'photo_together',
      photoPath,
      createdAt: new Date(),
    });
  }

  /** Family Graph: nodes(persons) + edges(parent + photo_together) */
  async getGraph(): Promise<FamilyGraphResponse> {
    const persons = await this.listPersons();
    const nodes = persons.map((p) => ({ id: p.id, name: p.name, type: 'person' as const }));

    const edges: FamilyGraphResponse['edges'] = [];
    for (const p of persons) {
      for (const parentId of p.parentIds ?? []) {
        edges.push({ from: parentId, to: p.id, relation: 'parent' });
      }
    }
    const graphEdges = await this.mongo.getGraphEdgesCollection().find({}).toArray();
    for (const e of graphEdges as GraphEdge[]) {
      edges.push({
        from: e.from,
        to: e.to,
        relation: e.type,
        photoPath: e.photoPath,
      });
    }
    return { nodes, edges };
  }

  /** 이름으로 person 찾기 (첫 번째 매칭) */
  async findPersonByName(name: string): Promise<Person | null> {
    return this.mongo.getPersonCollection().findOne({ name });
  }

  /** v2: 이름 목록으로 Person 노드 보장 (없으면 생성). AI 분석 결과 people 연동용. */
  async updatePeople(people: string[]): Promise<void> {
    for (const name of people) {
      if (!name?.trim()) continue;
      const existing = await this.findPersonByName(name.trim());
      if (!existing) {
        await this.createPerson({ name: name.trim(), relation: 'child' });
      }
    }
  }
}
