/**
 * 모든 데이터 삭제: Mongo (memories, persons, graph_edges) + Qdrant (memories, faces)
 *
 * 사용법:
 *   pnpm run clear-all
 *
 * 주의: brain-data/ 폴더 내 실제 파일(사진·문서)은 삭제하지 않습니다. DB·벡터만 비웁니다.
 */
import { MongoClient } from 'mongodb';
import axios from 'axios';
import {
  MONGO_URL,
  MONGO_DB_NAME,
  MONGO_COLLECTION_MEMORIES,
  MONGO_COLLECTION_PERSONS,
  MONGO_COLLECTION_GRAPH_EDGES,
  QDRANT_URL,
  COLLECTION_MEMORY,
  COLLECTION_FACES,
} from '../src/common/constants';

async function main() {
  const mongo = new MongoClient(MONGO_URL);
  try {
    await mongo.connect();
    const db = mongo.db(MONGO_DB_NAME);

    const memCol = db.collection(MONGO_COLLECTION_MEMORIES);
    const memR = await memCol.deleteMany({});
    console.log('Mongo: memories', memR.deletedCount, '건 삭제');

    const personsCol = db.collection(MONGO_COLLECTION_PERSONS);
    const personsR = await personsCol.deleteMany({});
    console.log('Mongo: persons', personsR.deletedCount, '건 삭제');

    const edgesCol = db.collection(MONGO_COLLECTION_GRAPH_EDGES);
    const edgesR = await edgesCol.deleteMany({});
    console.log('Mongo: graph_edges', edgesR.deletedCount, '건 삭제');
  } finally {
    await mongo.close();
  }

  for (const name of [COLLECTION_MEMORY, COLLECTION_FACES]) {
    try {
      await axios.delete(`${QDRANT_URL}/collections/${name}`);
      console.log('Qdrant:', name, '컬렉션 삭제 완료');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        console.log('Qdrant:', name, '(없음, 스킵)');
      } else {
        console.warn('Qdrant', name, '삭제 실패:', axios.isAxiosError(err) ? err.response?.status ?? err.message : err);
      }
    }
  }

  console.log('\n모든 데이터 비우기 완료. (brain-data/ 파일은 그대로 둠. UI 새로고침 후 확인)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
