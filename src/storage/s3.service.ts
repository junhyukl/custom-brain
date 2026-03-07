import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STORAGE_CONFIG } from '../config/storage.config';

export interface S3UploadResult {
  key: string;
}

/**
 * S3 업로드· presigned URL· 삭제. S3_BUCKET 미설정 시 no-op.
 */
@Injectable()
export class S3Service {
  private client: S3Client | null = null;

  private getClient(): S3Client | null {
    if (!STORAGE_CONFIG.useS3 || !STORAGE_CONFIG.s3.bucket) return null;
    if (this.client) return this.client;
    this.client = new S3Client({
      region: STORAGE_CONFIG.s3.region,
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
    return this.client;
  }

  async upload(buffer: Buffer, key: string, contentType?: string): Promise<S3UploadResult | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: STORAGE_CONFIG.s3.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType ?? undefined,
        }),
      );
      return { key };
    } catch (err) {
      console.error('[S3Service] upload failed:', key, err instanceof Error ? err.message : err);
      return null;
    }
  }

  /** S3 key에 대한 presigned GET URL (기본 1시간) */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const client = this.getClient();
    if (!client) return '';
    try {
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: STORAGE_CONFIG.s3.bucket, Key: key }),
        { expiresIn },
      );
    } catch (err) {
      console.error('[S3Service] getPresignedUrl failed:', key, err instanceof Error ? err.message : err);
      return '';
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      await client.send(
        new DeleteObjectCommand({ Bucket: STORAGE_CONFIG.s3.bucket, Key: key }),
      );
      return true;
    } catch (err) {
      console.error('[S3Service] delete failed:', key, err instanceof Error ? err.message : err);
      return false;
    }
  }
}
