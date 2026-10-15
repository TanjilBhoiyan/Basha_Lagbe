import { JwtService } from '@nestjs/jwt';
import { type OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import type { JwtPayload } from '../auth/jwt-auth.guard.js';

/**
 * Real-time chat. The app connects with its login token:
 *   io(API_URL, { auth: { token } })
 * Each user joins a private room "user:<id>"; the server pushes
 * "chat:message" and "chat:read" events there. Sending still goes through the REST API.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatsGateway implements OnGatewayConnection {
  @WebSocketServer() private server: Server;

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      const payload = await this.jwt.verifyAsync<JwtPayload>(String(token));
      if (payload.purpose) throw new Error('wrong token type'); // reset-password tokens can't chat
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  /** Push an event to every open app of one user. */
  toUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}