import { Module } from '@nestjs/common';

import { ChatsController } from './chats.controller.js';
import { ChatsGateway } from './chats.gateway.js';
import { ChatsService } from './chats.service.js';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway],
})
export class ChatsModule {}