import type { ConfigService } from '@nestjs/config';

import { SmsSendError, type SmsProvider } from '../sms.provider.js';

const DEFAULT_URL = 'https://rhsmsbd.top/api/v1/send';
const TIMEOUT_MS = 15000;

/**
 * rhsmsbd.top
 * .env: SMS_PROVIDER="rhsms" and RHSMS_API_TOKEN="..." (from the rhsmsbd dashboard)
 */
export class RhSmsProvider implements SmsProvider {
  private readonly token: string;
  private readonly url: string;

  constructor(config: ConfigService) {
    this.token = config.getOrThrow<string>('RHSMS_API_TOKEN');
    this.url = config.get<string>('RHSMS_API_URL', DEFAULT_URL);
  }

  async send(phone: string, message: string): Promise<void> {
    let res: Response;
    try {
      res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        // URLSearchParams URL-encodes the message, as their API asks.
        body: new URLSearchParams({ api_token: this.token, phone: `0${phone}`, message }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      throw new SmsSendError(`rhsms unreachable: ${(e as Error).message}`);
    }

    const text = await res.text();
    let data: { status?: string; message?: string } | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      // not JSON
    }
    if (!res.ok || data?.status !== 'success') {
      throw new SmsSendError(`rhsms refused (HTTP ${res.status}): ${data?.message ?? text.slice(0, 200)}`);
    }
  }
}