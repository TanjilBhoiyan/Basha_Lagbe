import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConsoleSmsProvider } from './providers/console.provider.js';
import { RhSmsProvider } from './providers/rhsms.provider.js';
import { SmsSendError, type SmsProvider } from './sms.provider.js';

/**
 * All SMS companies we can use. SMS_PROVIDER in .env picks one by its name here.
 * New company: make a file in ./providers, then add one line below.
 */
const PROVIDERS: Record<string, new (config: ConfigService) => SmsProvider> = {
  console: ConsoleSmsProvider,
  rhsms: RhSmsProvider,
};

/** Sends SMS through the company chosen in .env. The rest of the app only uses this. */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: SmsProvider;

  constructor(config: ConfigService) {
    const name = config.get<string>('SMS_PROVIDER', 'console');
    const Provider = PROVIDERS[name];
    if (!Provider) {
      throw new Error(`Unknown SMS_PROVIDER "${name}". Use one of: ${Object.keys(PROVIDERS).join(', ')}`);
    }
    this.provider = new Provider(config);
    this.logger.log(`SMS provider: ${name}`);
  }

  /** `phone` is 10 digits ("1712345678"). Throws a 503 with a friendly message if it fails. */
  async send(phone: string, message: string): Promise<void> {
    try {
      await this.provider.send(phone, message);
    } catch (e) {
      // Full reason in our logs (never the API token); a short message for the user.
      this.logger.error(`SMS to +880${phone} failed: ${e instanceof SmsSendError ? e.message : String(e)}`);
      throw new ServiceUnavailableException('We could not send the SMS right now. Please try again in a minute.');
    }
  }
}