/**
 * Face recognition & family tagging (@vladmandic/face-api + canvas).
 * Requires: face models in FACE_MODEL_PATH, family descriptors in brain-data/family/faces.json.
 */
import fs from 'fs';
import { STORAGE_CONFIG } from '../config/storage.config';
import { FACE_MODEL_PATH, FACE_MATCH_THRESHOLD } from '../config/face.config';

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

function getFaceApi(): typeof import('@vladmandic/face-api') {
  return require('@vladmandic/face-api');
}

function getNodeCanvas(): {
  Canvas: unknown;
  Image: unknown;
  ImageData: unknown;
  loadImage: (p: string) => Promise<unknown>;
} {
  return require('canvas');
}

async function ensureModelsLoaded(): Promise<boolean> {
  if (modelsLoaded) return true;
  try {
    const faceapi = getFaceApi();
    const nodeCanvas = getNodeCanvas();
    // node-canvas types are compatible at runtime; face-api expects DOM types
    faceapi.env.monkeyPatch(nodeCanvas as Parameters<typeof faceapi.env.monkeyPatch>[0]);
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
  if (familyDescriptors.length > 0) return;
  const p = STORAGE_CONFIG.family.facesJson;
  try {
    if (fs.existsSync(p)) {
      familyDescriptors = JSON.parse(fs.readFileSync(p, 'utf-8')) as FamilyDescriptor[];
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
  if (!(await ensureModelsLoaded())) return [];

  try {
    const faceapi = getFaceApi();
    const nodeCanvas = getNodeCanvas();
    const img = await nodeCanvas.loadImage(filePath);
    const detections = await faceapi
      .detectAllFaces(img as never)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const results: FaceMatch[] = [];
    for (const det of detections) {
      const descriptor = det.descriptor as Float32Array;
      let name = 'unknown';
      let bestDistance = 1;
      for (const f of familyDescriptors) {
        const distance = faceapi.euclideanDistance(descriptor, new Float32Array(f.descriptor));
        if (distance < FACE_MATCH_THRESHOLD && distance < bestDistance) {
          bestDistance = distance;
          name = f.name;
        }
      }
      results.push({ name, confidence: 1 - bestDistance });
    }
    return results;
  } catch {
    return [];
  }
}
