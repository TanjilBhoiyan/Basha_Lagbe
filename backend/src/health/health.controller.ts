import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /health — is the API up, and can it reach the database? */
  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return {
      status: 'ok',
      database: 'up',
      dbLatencyMs: Date.now() - started,
      time: new Date().toISOString(),
    };
  }
}