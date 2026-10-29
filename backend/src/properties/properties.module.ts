import { Module } from '@nestjs/common';

import { GeocodeModule } from '../geocode/geocode.module.js';

import { ListingExpiryService } from './listing-expiry.service.js';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';

@Module({
  imports: [GeocodeModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, ListingExpiryService],
})
export class PropertiesModule {}