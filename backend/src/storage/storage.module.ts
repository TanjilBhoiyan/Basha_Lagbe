import { Global, Module } from '@nestjs/common';

import { StorageService } from './storage.service.js';

/** Global: any module can inject StorageService without importing this module. */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}