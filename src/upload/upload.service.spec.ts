import { Test, TestingModule } from '@nestjs/testing';
import fs from 'fs/promises';
import path from 'path';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { S3Service } from '../storage/s3.service';

jest.mock('fs/promises');
jest.mock('../config/storage.config', () => ({
  STORAGE_CONFIG: {
    useS3: false,
    personal: { photos: '/tmp/brain-photos', documents: '/tmp/brain-docs' },
  },
  S3_REF_PREFIX: 's3:',
}));

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: S3Service, useValue: { upload: jest.fn(), getPresignedUrl: jest.fn(), deleteObject: jest.fn() } },
      ],
    }).compile();

    service = mod.get(UploadService);
  });

  it('saves photo and returns pathForProcessing and filePathForMetadata', async () => {
    const result = await service.saveFile(Buffer.from('x'), 'img.jpg', 'photo');

    expect(fs.mkdir).toHaveBeenCalledWith('/tmp/brain-photos', { recursive: true });
    expect(fs.writeFile).toHaveBeenCalled();
    expect(result.pathForProcessing).toContain(path.join('/tmp/brain-photos', ''));
    expect(result.filePathForMetadata).toBe(result.pathForProcessing);
    expect(path.extname(result.pathForProcessing)).toBe('.jpg');
  });

  it('saves document and returns path', async () => {
    const result = await service.saveFile(Buffer.from('x'), 'doc.pdf', 'document');

    expect(fs.mkdir).toHaveBeenCalledWith('/tmp/brain-docs', { recursive: true });
    expect(result.pathForProcessing).toMatch(/\.pdf$/);
    expect(result.filePathForMetadata).toBe(result.pathForProcessing);
  });

  it('accepts .docx for document upload', async () => {
    const result = await service.saveFile(Buffer.from('x'), 'sample.docx', 'document');

    expect(result.pathForProcessing).toMatch(/\.docx$/);
    expect(result.filePathForMetadata).toBe(result.pathForProcessing);
  });

  it('throws for unsupported document extension', async () => {
    await expect(service.saveFile(Buffer.from('x'), 'file.exe', 'document')).rejects.toThrow(BadRequestException);
  });
});
