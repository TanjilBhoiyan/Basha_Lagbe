import { Controller, Get, Query } from '@nestjs/common';

import { LocationsService } from './locations.service.js';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  /**
   * GET /locations                -> popular areas
   * GET /locations?q=mir          -> search by area/city
   * GET /locations?ids=a,b        -> specific areas (e.g. "recent" list)
   */
  @Get()
  list(@Query('q') q?: string, @Query('ids') ids?: string) {
    if (ids) return this.locations.findByIds(ids.split(',').filter(Boolean).slice(0, 20));
    if (q) return this.locations.search(q);
    return this.locations.popular();
  }
}