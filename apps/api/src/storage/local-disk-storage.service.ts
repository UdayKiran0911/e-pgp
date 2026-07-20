import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import type { StorageProvider } from './storage.types';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

// "Day 1" StorageProvider implementation: saves uploaded files to local
// disk under apps/api/uploads/ (gitignored). Real S3-compatible storage
// is a separate infra decision, deliberately not made here.
@Injectable()
export class LocalDiskStorageService implements StorageProvider, OnModuleInit {
  async onModuleInit() {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  async save(buffer: Buffer, originalFilename: string): Promise<string> {
    const storageKey = `${randomUUID()}${extname(originalFilename)}`;
    await writeFile(join(UPLOAD_DIR, storageKey), buffer);
    return storageKey;
  }

  getAbsolutePath(storageKey: string): string {
    return join(UPLOAD_DIR, storageKey);
  }

  async delete(storageKey: string): Promise<void> {
    await unlink(this.getAbsolutePath(storageKey)).catch(() => undefined);
  }
}
