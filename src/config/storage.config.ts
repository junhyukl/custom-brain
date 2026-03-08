import path from 'path';

const BRAIN_DATA = process.env.BRAIN_DATA_PATH ?? path.join(process.cwd(), 'brain-data');

/** S3 사용 시 메타데이터 filePath에 붙이는 접두사 (예: s3:personal/photos/xxx.jpg) */
export const S3_REF_PREFIX = 's3:';

const S3_BUCKET = process.env.S3_BUCKET ?? '';
const S3_REGION = process.env.S3_REGION ?? process.env.AWS_REGION ?? 'us-east-1';

export const STORAGE_CONFIG = {
  root: BRAIN_DATA,
  /** S3_BUCKET 이 설정되면 업로드는 S3로, 없으면 로컬 brain-data */
  useS3: S3_BUCKET.length > 0,
  s3: {
    bucket: S3_BUCKET,
    region: S3_REGION,
  },
  personal: {
    notes: path.join(BRAIN_DATA, 'personal', 'notes'),
    documents: path.join(BRAIN_DATA, 'personal', 'documents'),
    projects: path.join(BRAIN_DATA, 'personal', 'projects'),
    photos: path.join(BRAIN_DATA, 'personal', 'photos'),
    voice: path.join(BRAIN_DATA, 'personal', 'voice'),
  },
  family: {
    photos: path.join(BRAIN_DATA, 'family', 'photos'),
    history: path.join(BRAIN_DATA, 'family', 'history'),
    documents: path.join(BRAIN_DATA, 'family', 'documents'),
    /** 가족 얼굴 DB (faces.json) 및 학습용 사진 (faces_src/) */
    facesJson: path.join(BRAIN_DATA, 'family', 'faces.json'),
    facesSrc: path.join(BRAIN_DATA, 'family', 'faces_src'),
  },
  /** 배치 업로드: 파일을 넣어두면 스케줄/스크립트가 처리. processed 하위로 이동 */
  upload: {
    dir: process.env.UPLOAD_FOLDER || path.join(BRAIN_DATA, 'upload'),
  },
};
