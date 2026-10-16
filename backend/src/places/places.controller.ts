import { Controller, Get, Query } from '@nestjs/common';

import { NearbyPlacesQuery } from './places.dto.js';
import { PlacesService } from './places.service.js';

@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  /** GET /places/nearby?lat=&lng= -> { places: [{ id, name, address, latitude, longitude }] } */
  @Get('nearby')
  async nearby(@Query() q: NearbyPlacesQuery) {
    return { places: await this.places.nearby(q.lat, q.lng) };
  }
}