import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard.js';
import { MessagesQuery, SendMessageDto, StartChatDto } from './chats.dto.js';
import { ChatsService } from './chats.service.js';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  /** GET /chats — Messages tab */
  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.chats.list(user.sub);
  }

  /** GET /chats/unread-count — badge on the Messages tab (must stay above ":id") */
  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.chats.unreadCount(user.sub);
  }

  /** POST /chats { propertyId } — open the chat with a listing's owner */
  @Post()
  start(@CurrentUser() user: JwtPayload, @Body() dto: StartChatDto) {
    return this.chats.start(user.sub, dto.propertyId);
  }

  /** GET /chats/:id — chat header (property + the other person) */
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.chats.findOne(user.sub, id);
  }

  /** GET /chats/:id/messages?before=... */
  @Get(':id/messages')
  messages(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: MessagesQuery,
  ) {
    return this.chats.messages(user.sub, id, query.before);
  }

  /** POST /chats/:id/messages { text } */
  @Post(':id/messages')
  send(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chats.send(user.sub, id, dto.text);
  }

  /** POST /chats/:id/read — I've seen the chat */
  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  read(@CurrentUser() user: JwtPayload, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.chats.markRead(user.sub, id);
  }
}