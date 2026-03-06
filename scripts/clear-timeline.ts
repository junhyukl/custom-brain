/**
 * Timeline(메모리) 전부 삭제: Mongo memories 컬렉션 + Qdrant memories 컬렉션
 *
 * 사용법:
 *   pnpm run clear-timeline
 */
import { MongoClient } from 'mongodb';
import axios from 'axios';
import {
  MONGO_URL,
  MONGO_DB_NAME,
  MONGO_COLLECTION_MEMORIES,
  QDRANT_URL,
  COLLECTION_MEMORY,
} from '../src/common/constants';

async function main() {
  const mongo = new MongoClient(MONGO_URL);
  try {
    await mongo.connect();
    const db = mongo.db(MONGO_DB_NAME);
    const col = db.collection(MONGO_COLLECTION_MEMORIES);
    const r = await col.deleteMany({});
    console.log('Mongo: memories 컬렉션', r.deletedCount, '건 삭제');
  } finally {
    await mongo.close();
  }

  try {
    await axios.delete(`${QDRANT_URL}/collections/${COLLECTION_MEMORY}`);
    console.log('Qdrant: memories 컬렉션 삭제 완료 (다음 업로드 시 자동 재생성)');
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        console.log('Qdrant: memories 컬렉션이 없음 (이미 비어 있음)');
      } else {
        console.warn('Qdrant 컬렉션 삭제 실패 (Mongo는 비워짐, Timeline은 비어 보입니다):', err.response?.status ?? err.message);
      }
    } else {
      throw err;
    }
  }

  console.log('Timeline 비우기 완료. UI 새로고침 후 확인하세요.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
