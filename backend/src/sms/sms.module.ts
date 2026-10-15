import { Global, Module } from '@nestjs/common';

import { SmsService } from './sms.service.js';

/** Global: any module (OTP now, notifications later) can inject SmsService. */
@Global()
@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}