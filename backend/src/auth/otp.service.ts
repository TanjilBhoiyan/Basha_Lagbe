import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OtpPurpose } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // a code works for 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // same as the app's resend timer
const MOCK_CODE = '123456';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly mock: boolean;
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.mock = config.get('OTP_MOCK') === 'true';
    this.secret = config.getOrThrow<string>('JWT_SECRET');
  }

  /** Creates a new code (older unused codes stop working) and "sends" it. */
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

    await this.prisma.$transaction([
      this.prisma.otpCode.deleteMany({ where: { phone, purpose, consumedAt: null } }),
      this.prisma.otpCode.create({
        data: { phone, purpose, codeHash: this.hash(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
      }),
    ]);

    if (this.mock) {
      this.logger.warn(`[MOCK SMS] OTP for +880${phone} (${purpose}): ${code}`);
    } else {
      // TODO: send the code with a real SMS gateway (SSL Wireless, BulkSMSBD...).
      this.logger.error('OTP_MOCK is false but no SMS gateway is configured yet.');
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