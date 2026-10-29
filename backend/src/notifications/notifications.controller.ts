import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard.js';
import { ListNotificationsQuery, PushTokenDto } from './notifications.dto.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** GET /notifications?before=<id> — my notification list, newest first */
  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListNotificationsQuery) {
    return this.notifications.list(user.sub, query.before);
  }

  /** GET /notifications/unread-count — { count } for the red dot on the bell */
  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifications.unreadCount(user.sub);
  }

  /** POST /notifications/read-all — mark every notification as read */
  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }

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

  /** POST /notifications/test — sends a test notification to me (for checking the setup) */
  @Post('test')
  @HttpCode(HttpStatus.NO_CONTENT)
  test(@CurrentUser() user: JwtPayload) {
    return this.notifications.sendToUser(user.sub, {
      title: 'Basa Lagbe',
      body: 'Notifications are working!',
    });
  }

  /** POST /notifications/:id/read — mark one as read (must stay below the fixed routes above) */
  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@CurrentUser() user: JwtPayload, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notifications.markRead(user.sub, id);
  }
}