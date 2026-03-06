import { Test, TestingModule } from '@nestjs/testing';
import fs from 'fs/promises';
import path from 'path';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';

jest.mock('fs/promises');
jest.mock('../config/storage.config', () => ({
  STORAGE_CONFIG: {
    personal: { photos: '/tmp/brain-photos', documents: '/tmp/brain-docs' },
  },
}));

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    const mod: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = mod.get(UploadService);
  });

  it('saves photo and returns path', async () => {
    const filePath = await service.saveFile(Buffer.from('x'), 'img.jpg', 'photo');

    expect(fs.mkdir).toHaveBeenCalledWith('/tmp/brain-photos', { recursive: true });
    expect(fs.writeFile).toHaveBeenCalled();
    expect(filePath).toContain(path.join('/tmp/brain-photos', ''));
    expect(path.extname(filePath)).toBe('.jpg');
  });

  it('saves document and returns path', async () => {
    const filePath = await service.saveFile(Buffer.from('x'), 'doc.pdf', 'document');

    expect(fs.mkdir).toHaveBeenCalledWith('/tmp/brain-docs', { recursive: true });
    expect(filePath).toMatch(/\.pdf$/);
  });

  it('throws for unsupported document extension', async () => {
    await expect(service.saveFile(Buffer.from('x'), 'file.exe', 'document')).rejects.toThrow(BadRequestException);
  });
});
