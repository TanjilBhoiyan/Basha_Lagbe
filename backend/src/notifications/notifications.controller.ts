import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard.js';
import { PushTokenDto } from './notifications.dto.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** POST /notifications/token { token } — after login / app start: this phone gets my notifications */
  @Post('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  saveToken(@CurrentUser() user: JwtPayload, @Body() dto: PushTokenDto) {
    return this.notifications.saveToken(user.sub, dto.token);
  }

  /** DELETE /notifications/token { token } — on logout */
  @Delete('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeToken(@CurrentUser() user: JwtPayload, @Body() dto: PushTokenDto) {
    return this.notifications.removeToken(user.sub, dto.token);
  }

  /** POST /notifications/test — sends a test notification to my own phones (for checking the setup) */
  @Post('test')
  @HttpCode(HttpStatus.NO_CONTENT)
  test(@CurrentUser() user: JwtPayload) {
    return this.notifications.sendToUser(user.sub, {
      title: 'Basa Lagbe',
      body: 'Notifications are working!',
    });
  }
}