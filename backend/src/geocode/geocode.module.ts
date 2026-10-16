import { Module } from '@nestjs/common';

import { GeocodeController } from './geocode.controller.js';
import { GeocodeService } from './geocode.service.js';

@Module({
  controllers: [GeocodeController],
  providers: [GeocodeService],
  // Properties use it to name the area of a pinned listing.
  exports: [GeocodeService],
})
export class GeocodeModule {}