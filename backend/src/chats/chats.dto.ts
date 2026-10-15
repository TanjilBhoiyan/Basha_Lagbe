import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export const MESSAGE_MAX_LENGTH = 1000;

/** POST /chats — open (or reuse) the chat with a listing's owner. */
export class StartChatDto {
  @IsUUID()
  propertyId: string;
}

/** POST /chats/:id/messages */
export class SendMessageDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'Message is empty.' })
  @MaxLength(MESSAGE_MAX_LENGTH, { message: 'Message is too long.' })
  text: string;
}

/** GET /chats/:id/messages?before=<ISO time> — older pages for scrolling up */
export class MessagesQuery {
  @IsOptional()
  @IsDateString()
  before?: string;
}