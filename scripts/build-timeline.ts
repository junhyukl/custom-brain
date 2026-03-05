/**
 * Timeline Engine: Memory 기반 연도/이벤트 통계 생성.
 * Timeline API (GET /brain/timeline)는 Mongo에서 실시간 조회되며,
 * 이 스크립트는 전체 메모리 통계(연도별 건수)를 출력합니다.
 *
 * 사용법: pnpm run build-timeline
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TimelineService } from '../src/brain-core/timeline.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const timeline = app.get(TimelineService);
  const result = await timeline.buildTimeline();
  await app.close();

  console.log('Timeline built.');
  console.log('  total memories:', result.total);
  console.log('  with date:', result.withDate);
  console.log('  by year:', result.byYear);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
