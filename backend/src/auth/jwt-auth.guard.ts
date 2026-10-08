import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

/** What we put inside the access token. */
export type JwtPayload = { sub: string; role: string; purpose?: string };

type AuthedRequest = Request & { user?: JwtPayload };

/**
 * Protects a route: requires "Authorization: Bearer <accessToken>".
 * Usage: @UseGuards(JwtAuthGuard) on a controller or route.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Please log in.');
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      // A password-reset token must not work as a login token.
      if (payload.purpose) throw new Error('wrong token type');
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }
  }
}

/** Use in a guarded route: me(@CurrentUser() user: JwtPayload) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AuthedRequest>().user,
);