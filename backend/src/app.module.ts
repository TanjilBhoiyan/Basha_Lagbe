import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ChatsModule } from './chats/chats.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { GeocodeModule } from './geocode/geocode.module.js';
import { HealthModule } from './health/health.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PlacesModule } from './places/places.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { SmsModule } from './sms/sms.module.js';
import { StorageModule } from './storage/storage.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { VisitsModule } from './visits/visits.module.js';

@Module({
  imports: [
    // Loads backend/.env into process.env for the whole app.
    ConfigModule.forRoot({ isGlobal: true }),
    // Daily jobs (e.g. listing reminders / expiry)
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    NotificationsModule,
    SmsModule,
    HealthModule,
    AuthModule,
    LocationsModule,
    PropertiesModule,
    FavoritesModule,
    VisitsModule,
    UploadsModule,
    ChatsModule,
    GeocodeModule,
    PlacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}