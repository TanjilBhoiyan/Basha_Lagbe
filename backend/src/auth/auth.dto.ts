import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

import { BD_PHONE_REGEX, normalizeBdPhone } from '../common/phone.js';

/** Request bodies for /auth/*. Invalid input is rejected with 400 before reaching the service. */

const toPhone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? normalizeBdPhone(value) : value;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const PHONE_MESSAGE = 'Enter a valid Bangladeshi number, e.g. 1712345678';
const STRONG_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;
const PASSWORD_MESSAGE = 'Use at least 8 characters with letters, numbers and symbols';

export const OTP_PURPOSES = ['register', 'reset-password'] as const;
export type OtpPurposeInput = (typeof OTP_PURPOSES)[number];

export class RegisterDto {
  @Transform(trim)
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(60)
  fullName: string;

  @Transform(toPhone)
  @Matches(BD_PHONE_REGEX, { message: PHONE_MESSAGE })
  phone: string;

  @Transform(toEmail)
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @Matches(STRONG_PASSWORD, { message: PASSWORD_MESSAGE })
  password: string;
}

export class VerifyOtpDto {
  @Transform(toPhone)
  @Matches(BD_PHONE_REGEX, { message: PHONE_MESSAGE })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'Enter the 6-digit code' })
  code: string;

  @IsIn(OTP_PURPOSES)
  purpose: OtpPurposeInput;
}

export class ResendOtpDto {
  @Transform(toPhone)
  @Matches(BD_PHONE_REGEX, { message: PHONE_MESSAGE })
  phone: string;

  @IsIn(OTP_PURPOSES)
  purpose: OtpPurposeInput;
}

export class LoginDto {
  /** Phone number or email. */
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Phone or email is required' })
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class ForgotPasswordDto {
  /** Phone number or email. */
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Phone or email is required' })
  identifier: string;
}

export class ResetPasswordDto {
  /** Short-lived token returned by /auth/verify-otp (purpose: reset-password). */
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @Matches(STRONG_PASSWORD, { message: PASSWORD_MESSAGE })
  newPassword: string;
}