import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';

import { normalizeBdPhone } from '../common/phone.js';
import { OtpPurpose, type User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto, OtpPurposeInput, RegisterDto, ResetPasswordDto } from './auth.dto.js';
import { OtpService } from './otp.service.js';

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL = '10m';

/** What the app sees — never includes the password hash. Same shape as the app's `User` type. */
export type PublicUser = Pick<User, 'id' | 'fullName' | 'phone' | 'email' | 'phoneVerified'>;

export type AuthResult = { accessToken: string; user: PublicUser };

const toPurpose = (p: OtpPurposeInput) =>
  p === 'register' ? OtpPurpose.REGISTER : OtpPurpose.RESET_PASSWORD;

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, fullName: u.fullName, phone: u.phone, email: u.email, phoneVerified: u.phoneVerified };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
  ) {}

  /** Creates the account (unverified) and sends an OTP to the phone. */
  async register(dto: RegisterDto): Promise<{ phone: string }> {
    const byPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (byPhone?.phoneVerified) {
      throw new ConflictException('An account with this phone number already exists.');
    }
    const byEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (byEmail && byEmail.id !== byPhone?.id) {
      throw new ConflictException('An account with this email already exists.');
    }

    const data = {
      fullName: dto.fullName,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    };
    // Someone who registered before but never verified can simply try again.
    if (byPhone) {
      await this.prisma.user.update({ where: { id: byPhone.id }, data });
    } else {
      await this.prisma.user.create({ data: { ...data, phone: dto.phone } });
    }

    await this.otp.send(dto.phone, OtpPurpose.REGISTER);
    return { phone: dto.phone };
  }

  /**
   * register       -> marks the phone verified and logs the user in
   * reset-password -> returns a short-lived token for /auth/reset-password
   */
  async verifyOtp(
    phone: string,
    code: string,
    purpose: OtpPurposeInput,
  ): Promise<AuthResult | { resetToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException('Account not found. Please register again.');

    await this.otp.verify(phone, toPurpose(purpose), code);

    if (purpose === 'register') {
      const verified = await this.prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
      return this.issueToken(verified);
    }

    const resetToken = await this.jwt.signAsync(
      { sub: user.id, purpose: 'reset-password' },
      { expiresIn: RESET_TOKEN_TTL },
    );
    return { resetToken };
  }

  async resendOtp(phone: string, purpose: OtpPurposeInput): Promise<{ phone: string }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException('Account not found.');
    await this.otp.send(phone, toPurpose(purpose));
    return { phone };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.findByIdentifier(dto.identifier);
    // Same message for "no account" and "wrong password", so nobody can probe which numbers exist.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect phone/email or password.');
    }
    if (!user.phoneVerified) {
      throw new ForbiddenException('Please verify your phone number first. Register again to get a new code.');
    }
    return this.issueToken(user);
  }

  /** Starts password reset. Returns the phone the OTP was sent to. */
  async forgotPassword(identifier: string): Promise<{ phone: string }> {
    const user = await this.findByIdentifier(identifier);
    if (!user) throw new NotFoundException('No account found with these details.');
    await this.otp.send(user.phone, OtpPurpose.RESET_PASSWORD);
    return { phone: user.phone };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: true }> {
    let payload: { sub: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(dto.resetToken);
    } catch {
      throw new UnauthorizedException('This reset link has expired. Please start again.');
    }
    if (payload.purpose !== 'reset-password') {
      throw new UnauthorizedException('Invalid reset token.');
    }
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS) },
    });
    return { success: true };
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account not found.');
    return toPublicUser(user);
  }

  private findByIdentifier(identifier: string) {
    return identifier.includes('@')
      ? this.prisma.user.findUnique({ where: { email: identifier.trim().toLowerCase() } })
      : this.prisma.user.findUnique({ where: { phone: normalizeBdPhone(identifier) } });
  }

  private async issueToken(user: User): Promise<AuthResult> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: toPublicUser(user) };
  }
}