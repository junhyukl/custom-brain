import sharp from 'sharp';

/** LLaVA 등 Vision 모델 권장 최대 해상도. 초과 시 Ollama 400 방지 */
const MAX_VISION_SIDE = 672;

/**
 * Vision API 전송 전 이미지 리사이즈. 긴 변이 MAX_VISION_SIDE 이하로 맞추고 JPEG로 압축.
 */
export async function resizeForVision(buffer: Buffer): Promise<Buffer> {
  try {
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (w <= MAX_VISION_SIDE && h <= MAX_VISION_SIDE) return buffer;

    return await sharp(buffer)
      .resize(MAX_VISION_SIDE, MAX_VISION_SIDE, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return buffer;
  }
}
