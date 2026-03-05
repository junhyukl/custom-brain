import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db, Collection, Document, Filter } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private get uri(): string {
    return process.env.MONGO_URI ?? 'mongodb://localhost:27017';
  }

  private get dbName(): string {
    return process.env.MONGO_DB_NAME ?? 'custom-brain';
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  private async getDb(): Promise<Db> {
    if (this.db) return this.db;
    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    return this.db;
  }

  /** 컬렉션에서 filter로 find, limit 적용 */
  async runQuery(
    collectionName: string,
    filter: Filter<Document>,
    limit: number,
  ): Promise<Document[]> {
    const db = await this.getDb();
    const collection: Collection<Document> = db.collection(collectionName);
    return collection.find(filter).limit(limit).toArray();
  }
}
