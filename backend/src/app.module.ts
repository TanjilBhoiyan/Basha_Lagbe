import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { HealthModule } from './health/health.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PropertiesModule } from './properties/properties.module.js';

@Module({
  imports: [
    // Loads backend/.env into process.env for the whole app.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    LocationsModule,
    PropertiesModule,
    FavoritesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}