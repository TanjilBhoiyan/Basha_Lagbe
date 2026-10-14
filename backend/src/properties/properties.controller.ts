import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard.js';
import { ListPropertiesQuery, UpdateListingStatusDto } from './properties.dto.js';
import { PropertiesService } from './properties.service.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  /** GET /properties?type=apartment&minRent=10000&bedrooms=3&sort=price-asc&page=1 */
  @Get()
  list(@Query() query: ListPropertiesQuery) {
    return this.properties.list(query);
  }

  /** GET /properties/mine — the owner's own listings (must stay above ":id") */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: JwtPayload) {
    return this.properties.mine(user.sub);
  }

  /** GET /properties/:id */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.properties.findOne(id);
  }

  /** PATCH /properties/:id/status { status: "rented" | "published" } — owner only */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateListingStatusDto,
  ) {
    return this.properties.setStatus(user.sub, id, dto.status);
  }

  /** DELETE /properties/:id — owner only */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.properties.remove(user.sub, id);
  }
}