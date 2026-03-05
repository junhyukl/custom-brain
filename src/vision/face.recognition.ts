/**
 * Face recognition & family tagging using @vladmandic/face-api + canvas.
 * Requires: face models in FACE_MODEL_PATH, family descriptors in brain-data/family/faces.json.
 */
import fs from 'fs';
import path from 'path';
import { STORAGE_CONFIG } from '../config/storage.config';

const FACE_MODEL_PATH =
  process.env.FACE_MODEL_PATH ?? path.join(process.cwd(), 'face-models');
const MATCH_THRESHOLD = 0.6;

export interface FaceMatch {
  name: string;
  confidence: number;
}

interface FamilyDescriptor {
  name: string;
  descriptor: number[];
}

let modelsLoaded = false;
let familyDescriptors: FamilyDescriptor[] = [];

async function ensureModelsLoaded(): Promise<boolean> {
  if (modelsLoaded) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const faceapi = require('@vladmandic/face-api');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCanvas = require('canvas');
    faceapi.env.monkeyPatch({
      Canvas: nodeCanvas.Canvas,
      Image: nodeCanvas.Image,
      ImageData: nodeCanvas.ImageData,
    });

    if (fs.existsSync(FACE_MODEL_PATH)) {
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(FACE_MODEL_PATH);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(FACE_MODEL_PATH);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(FACE_MODEL_PATH);
      modelsLoaded = true;
    }
  } catch {
    modelsLoaded = false;
  }
  return modelsLoaded;
}

function loadFamilyDescriptors(): void {
  const p = STORAGE_CONFIG.family.facesJson;
  if (familyDescriptors.length > 0) return;
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      familyDescriptors = JSON.parse(raw) as FamilyDescriptor[];
    }
  } catch {
    familyDescriptors = [];
  }
}

/**
 * Detect faces in image and match to family DB (faces.json).
 * Returns [] if models not loaded or no faces.json.
 */
export async function detectFaces(filePath: string): Promise<FaceMatch[]> {
  loadFamilyDescriptors();
  const ok = await ensureModelsLoaded();
  if (!ok) return [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const faceapi = require('@vladmandic/face-api');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCanvas = require('canvas');
    const img = await nodeCanvas.loadImage(filePath);
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const results: FaceMatch[] = [];
    for (const det of detections) {
      const descriptor = det.descriptor as Float32Array;
      let name = 'unknown';
      let best = 1;
      for (const f of familyDescriptors) {
        const fd = new Float32Array(f.descriptor);
        const distance = faceapi.euclideanDistance(descriptor, fd);
        if (distance < MATCH_THRESHOLD && distance < best) {
          best = distance;
          name = f.name;
        }
      }
      results.push({ name, confidence: 1 - best });
    }
    return results;
  } catch {
    return [];
  }
}
