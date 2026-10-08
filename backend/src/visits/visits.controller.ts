import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard.js';
import { CreateVisitDto, MyVisitsQuery, RespondVisitDto } from './visits.dto.js';
import { VisitsService } from './visits.service.js';

@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  // ── Tenant ──

  /** GET /visits/mine?propertyId=... */
  @Get('mine')
  mine(@CurrentUser() user: JwtPayload, @Query() query: MyVisitsQuery) {
    return this.visits.mine(user.sub, query.propertyId);
  }

  /** POST /visits { propertyId, date, time, message } */
  @Post()
  request(@CurrentUser() user: JwtPayload, @Body() dto: CreateVisitDto) {
    return this.visits.request(user.sub, dto);
  }

  /** POST /visits/:id/cancel */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser() user: JwtPayload, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.visits.cancel(user.sub, id);
  }

  // ── Owner ──

  /** GET /visits/incoming — requests for my properties */
  @Get('incoming')
  incoming(@CurrentUser() user: JwtPayload) {
    return this.visits.incoming(user.sub);
  }

  /** POST /visits/:id/respond { decision: "confirm" | "decline" } */
  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  respond(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RespondVisitDto,
  ) {
    return this.visits.respond(user.sub, id, dto.decision);
  }
}