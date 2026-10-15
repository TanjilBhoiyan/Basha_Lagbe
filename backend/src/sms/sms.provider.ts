/**
 * Every SMS company is one class with this shape (see ./providers).
 * To switch company: add a provider file, list it in sms.service.ts, and set SMS_PROVIDER in .env.
 */
export interface SmsProvider {
  /**
   * Sends one SMS. `phone` is our 10-digit format ("1712345678");
   * each provider turns it into the format its API wants.
   * Throws SmsSendError when the company says it did not send.
   */
  send(phone: string, message: string): Promise<void>;
}

/** The SMS company refused or could not be reached. The message is for our logs, not for users. */
export class SmsSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmsSendError';
  }
}