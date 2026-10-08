import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** The logged-in user's saved (hearted) properties. */
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /favorites/ids -> ["<propertyId>", ...] newest first */
  @Get('ids')
  async ids(@CurrentUser() user: JwtPayload): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
      select: { propertyId: true },
    });
    return rows.map((r) => r.propertyId);
  }

  /** PUT /favorites/:propertyId — save (doing it twice is fine) */
  @Put(':propertyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async add(@CurrentUser() user: JwtPayload, @Param('propertyId', new ParseUUIDPipe()) propertyId: string) {
    const exists = await this.prisma.property.count({ where: { id: propertyId } });
    if (!exists) throw new NotFoundException('This listing is no longer available.');
    await this.prisma.favorite.upsert({
      where: { userId_propertyId: { userId: user.sub, propertyId } },
      create: { userId: user.sub, propertyId },
      update: {},
    });
  }

  /** DELETE /favorites/:propertyId — unsave */
  @Delete(':propertyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: JwtPayload, @Param('propertyId', new ParseUUIDPipe()) propertyId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId: user.sub, propertyId } });
  }
}