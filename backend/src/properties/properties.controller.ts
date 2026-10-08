import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { ListPropertiesQuery } from './properties.dto.js';
import { PropertiesService } from './properties.service.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  /** GET /properties?type=apartment&minRent=10000&bedrooms=3&sort=price-asc&page=1 */
  @Get()
  list(@Query() query: ListPropertiesQuery) {
    return this.properties.list(query);
  }

  /** GET /properties/:id */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.properties.findOne(id);
  }
}