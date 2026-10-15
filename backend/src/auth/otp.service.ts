import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OtpPurpose } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SmsService } from '../sms/sms.service.js';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // a code works for 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // same as the app's resend timer
const MOCK_CODE = '123456';

/** The SMS text. English only: Bangla SMS costs about 2x the credits. */
const SMS_TEXT: Record<OtpPurpose, (code: string) => string> = {
  REGISTER: (code) => `Your Basa Lagbe verification code is ${code}. It expires in 5 minutes. Do not share it with anyone.`,
  RESET_PASSWORD: (code) =>
    `Your Basa Lagbe password reset code is ${code}. It expires in 5 minutes. Do not share it with anyone.`,
};

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly mock: boolean;
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    config: ConfigService,
  ) {
    this.mock = config.get('OTP_MOCK') === 'true';
    this.secret = config.getOrThrow<string>('JWT_SECRET');
  }

  /**
   * Creates a new code (older unused codes stop working) and sends it by SMS.
   * OTP_MOCK=true: the code is always 123456 and no SMS is sent (development).
   */
  async send(phone: string, purpose: OtpPurpose): Promise<void> {
    const last = await this.prisma.otpCode.findFirst({
      where: { phone, purpose },
      orderBy: { createdAt: 'desc' },
    });
    if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000);
      throw new HttpException(`Please wait ${wait}s before requesting a new code.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.mock ? MOCK_CODE : String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');

    const [, saved] = await this.prisma.$transaction([
      this.prisma.otpCode.deleteMany({ where: { phone, purpose, consumedAt: null } }),
      this.prisma.otpCode.create({
        data: { phone, purpose, codeHash: this.hash(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
      }),
    ]);

    if (this.mock) {
      this.logger.warn(`[MOCK SMS] OTP for +880${phone} (${purpose}): ${code}`);
      return;
    }

    try {
      await this.sms.send(phone, SMS_TEXT[purpose](code));
    } catch (e) {
      // Not sent: remove the code so the user can try again right away (no 60s wait).
      await this.prisma.otpCode.delete({ where: { id: saved.id } }).catch(() => undefined);
      throw e;
    }
  }

  /** Throws with a user-friendly message unless the code is right. Marks it used on success. */
  async verify(phone: string, purpose: OtpPurpose, code: string): Promise<void> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This code has expired. Please request a new code.');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Please request a new code.');
    }

    if (!this.matches(code, otp.codeHash)) {
      const attempts = otp.attempts + 1;
      await this.prisma.otpCode.update({ where: { id: otp.id }, data: { attempts } });
      const left = OTP_MAX_ATTEMPTS - attempts;
      throw new BadRequestException(
        left > 0 ? `Incorrect code. ${left} attempt(s) left.` : 'Too many attempts. Please request a new code.',
      );
    }

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  }

  /** HMAC instead of plain SHA so a leaked table can't be brute-forced without the secret. */
  private hash(code: string): string {
    return createHmac('sha256', this.secret).update(code).digest('hex');
  }

  private matches(code: string, storedHash: string): boolean {
    const a = Buffer.from(this.hash(code), 'hex');
    const b = Buffer.from(storedHash, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }
}