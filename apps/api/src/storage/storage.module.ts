import { Module } from '@nestjs/common';
import { LocalDiskStorageService } from './local-disk-storage.service';

@Module({
  providers: [LocalDiskStorageService],
  exports: [LocalDiskStorageService],
})
export class StorageModule {}
