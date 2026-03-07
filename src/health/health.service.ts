import { Injectable } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { QDRANT_URL } from '../common/constants';

export interface HealthResult {
  status: 'ok' | 'degraded';
  mongo: boolean;
  qdrant: boolean;
  checks: { mongo: boolean; qdrant: boolean };
}

@Injectable()
export class HealthService {
  constructor(private readonly mongo: MongoService) {}

  async check(): Promise<HealthResult> {
    const [mongo, qdrant] = await Promise.all([
      this.mongo.ping(),
      this.pingQdrant(),
    ]);
    const status = mongo && qdrant ? 'ok' : 'degraded';
    return { status, mongo, qdrant, checks: { mongo, qdrant } };
  }

  private async pingQdrant(): Promise<boolean> {
    try {
      const res = await fetch(`${QDRANT_URL}/collections`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
