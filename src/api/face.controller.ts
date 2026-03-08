import { Body, Controller, Post } from '@nestjs/common';
import { FaceService } from '../vision/face.service';

/**
 * Face Recognition 연동. ai_family_system 등에서 임베딩으로 인물 매칭 시 호출.
 * POST /brain/face/match → Qdrant faces 컬렉션 검색.
 */
@Controller('brain/face')
export class FaceController {
  constructor(private readonly faceService: FaceService) {}

  @Post('match')
  async match(
    @Body() body: { embedding?: number[] },
  ): Promise<{ personId?: string; personName?: string } | { error: string }> {
    const embedding = body?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return { error: 'embedding array required' };
    }
    if (!this.faceService.isAvailable()) {
      return { error: 'Face service not available (FACE_SERVICE_URL)' };
    }
    const match = await this.faceService.findPerson(embedding);
    if (!match) return {};
    return { personId: match.personId, personName: match.personName };
  }
}
