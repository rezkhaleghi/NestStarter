import { Injectable } from '@nestjs/common';
import { OtpService } from '../interfaces/otp.service.interface';
import { VerifyOtpInput } from '../dtos/verify-otp.input';
import { InvalidOtpException } from '../../domain/exceptions/domain.exception';

/**
 * A standalone use case. Reusable anywhere OTP verification is needed
 * (signup, password reset, 2FA) — not buried inside signup logic.
 */
@Injectable()
export class VerifyOtpUseCase {
  constructor(private readonly otpService: OtpService) {}

  async execute(input: VerifyOtpInput): Promise<void> {
    const isValid = await this.otpService.verify(input.email, input.otp);
    if (!isValid) {
      throw new InvalidOtpException();
    }
  }
}
