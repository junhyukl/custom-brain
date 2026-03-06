import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from '../common/constants';

export type Neo4jDriver = import('neo4j-driver').Driver;
export type Neo4jSession = import('neo4j-driver').Session;

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Neo4jDriver | null = null;

  isAvailable(): boolean {
    return !!NEO4J_URI;
  }

  async onModuleInit(): Promise<void> {
    if (!NEO4J_URI) return;
    try {
      const { default: neo4j } = await import('neo4j-driver');
      this.driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
      await this.driver.verifyConnectivity();
    } catch (err) {
      console.warn('[Neo4j] Connection failed, graph DB disabled:', (err as Error).message);
      this.driver = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  getSession(): Neo4jSession | null {
    return this.driver?.session() ?? null;
  }

  async run<T = unknown>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
    if (!this.driver) return [];
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((r) => r.toObject() as T);
    } finally {
      await session.close();
    }
  }
}
