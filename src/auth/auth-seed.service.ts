import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { MongoService } from '../mongo/mongo.service';
import type { User } from '../schemas';

const SALT_ROUNDS = 10;
const SEED_EMAIL = 'junhyukl@gmail.com';
const SEED_PASSWORD = '1234AB!';

@Injectable()
export class AuthSeedService implements OnModuleInit {
  constructor(private readonly mongo: MongoService) {}

  async onModuleInit(): Promise<void> {
    await this.seedIfEmpty();
  }

  async seedIfEmpty(): Promise<void> {
    const col = this.mongo.getUsersCollection();
    const count = await col.countDocuments();
    if (count > 0) return;

    const normalized = SEED_EMAIL.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
    const user: User = {
      id: randomUUID(),
      email: normalized,
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
    };
    await col.insertOne(user);
    console.log(`[AuthSeed] Seeded default user: ${normalized}`);
  }
}
