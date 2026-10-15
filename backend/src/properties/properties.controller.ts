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
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard.js';
import { CreatePropertyDto, ListPropertiesQuery, UpdateListingStatusDto, UpdatePropertyDto } from './properties.dto.js';
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

  /** GET /properties/mine/:id — one of my listings with its private address (must stay above ":id") */
  @Get('mine/:id')
  @UseGuards(JwtAuthGuard)
  mineOne(@CurrentUser() user: JwtPayload, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.properties.mineOne(user.sub, id);
  }

  /** POST /properties — owner posts a new listing (goes live straight away) */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePropertyDto) {
    return this.properties.create(user.sub, dto);
  }

  /** GET /properties/:id */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.properties.findOne(id);
  }

  /** PUT /properties/:id — owner edits their listing (whole form) */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.properties.update(user.sub, id, dto);
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