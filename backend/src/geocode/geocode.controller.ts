import { Controller, Get, Query } from '@nestjs/common';

import { ReverseGeocodeQuery } from './geocode.dto.js';
import { GeocodeService } from './geocode.service.js';

@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocode: GeocodeService) {}

  /** GET /geocode/reverse?lat=&lng= -> { name: "Mohakhali", city: "Dhaka" } or { name: null, city: null } */
  @Get('reverse')
  async reverse(@Query() q: ReverseGeocodeQuery) {
    return (await this.geocode.reverse(q.lat, q.lng)) ?? { name: null, city: null };
  }
}