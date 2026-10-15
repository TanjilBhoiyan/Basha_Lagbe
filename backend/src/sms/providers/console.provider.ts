import { Logger } from '@nestjs/common';

import type { SmsProvider } from '../sms.provider.js';

/** Development: prints the SMS in the backend terminal instead of sending it (no credit used). */
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS');

  async send(phone: string, message: string): Promise<void> {
    this.logger.warn(`[NOT SENT] to +880${phone}: ${message}`);
  }
}