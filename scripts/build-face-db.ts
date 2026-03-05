/**
 * 가족 얼굴 DB 구축: faces_src/ 폴더의 사진에서 얼굴 추출 → faces.json 저장
 * 처음 한 번만 실행. 이후 ingest-photos 시 이 DB로 얼굴 태깅.
 *
 * 사용법:
 *   pnpm run build-face-db
 *
 * 폴더 구조:
 *   brain-data/family/faces_src/
 *     Grandfather_01.jpg   -> name: Grandfather
 *     Mother_02.png        -> name: Mother
 */
import fs from 'fs';
import path from 'path';
import { STORAGE_CONFIG } from '../src/config/storage.config';

const FACE_MODEL_PATH =
  process.env.FACE_MODEL_PATH ?? path.join(process.cwd(), 'face-models');

async function buildDB() {
  const facesSrc = STORAGE_CONFIG.family.facesSrc;
  const facesJson = STORAGE_CONFIG.family.facesJson;

  if (!fs.existsSync(facesSrc)) {
    fs.mkdirSync(facesSrc, { recursive: true });
    console.log('Created', facesSrc);
    console.log('Add one photo per person, e.g. Grandfather_01.jpg, Mother_02.png');
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const faceapi = require('@vladmandic/face-api');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCanvas = require('canvas');
  faceapi.env.monkeyPatch({
    Canvas: nodeCanvas.Canvas,
    Image: nodeCanvas.Image,
    ImageData: nodeCanvas.ImageData,
  });

  if (!fs.existsSync(FACE_MODEL_PATH)) {
    console.error('Face models not found at', FACE_MODEL_PATH);
    console.error('Download models from https://github.com/vladmandic/face-api-models or set FACE_MODEL_PATH');
    process.exit(1);
  }

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(FACE_MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(FACE_MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(FACE_MODEL_PATH);

  const files = fs.readdirSync(facesSrc).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const db: { name: string; descriptor: number[] }[] = [];

  for (const file of files) {
    const name = path.basename(file, path.extname(file)).split('_')[0];
    const filePath = path.join(facesSrc, file);
    try {
      const img = await nodeCanvas.loadImage(filePath);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) {
        db.push({
          name: name || file,
          descriptor: Array.from(detection.descriptor as Float32Array),
        });
        console.log('Added:', name, file);
      } else {
        console.warn('No face in', file);
      }
    } catch (e) {
      console.error('Skip', file, e);
    }
  }

  const outDir = path.dirname(facesJson);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(facesJson, JSON.stringify(db, null, 2), 'utf-8');
  console.log('Face DB built:', db.length, 'faces ->', facesJson);
}

buildDB().catch((e) => {
  console.error(e);
  process.exit(1);
});
