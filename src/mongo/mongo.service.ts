import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';
import type { Memory } from '../brain-schema';
import type { Person } from '../brain-schema';
import {
  MONGO_COLLECTION_MEMORIES,
  MONGO_COLLECTION_PERSONS,
  MONGO_COLLECTION_GRAPH_EDGES,
  MONGO_URL,
  MONGO_DB_NAME,
} from '../common/constants';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(MONGO_URL);
    this.db = this.client.db(MONGO_DB_NAME);
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  getMemoryCollection(): Collection<Memory> {
    return this.db.collection<Memory>(MONGO_COLLECTION_MEMORIES);
  }

  getPersonCollection(): Collection<Person> {
    return this.db.collection<Person>(MONGO_COLLECTION_PERSONS);
  }

  getGraphEdgesCollection(): Collection<GraphEdge> {
    return this.db.collection<GraphEdge>(MONGO_COLLECTION_GRAPH_EDGES);
  }
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'parent' | 'photo_together';
  photoPath?: string;
  createdAt?: Date;
}
