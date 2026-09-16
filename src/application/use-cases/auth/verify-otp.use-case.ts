import { Injectable } from "@nestjs/common";
import { OtpService } from "../../interfaces/otp.service.interface";
import { VerifyOtpInput } from "../../dtos/verify-otp.input";
import { InvalidOtpException } from "@domain/exceptions/domain.exception";
import { normalizeEmail } from "@domain/utils/normalize-email";

@Injectable()
export class VerifyOtpUseCase {
  constructor(private readonly otpService: OtpService) {}

  async execute(input: VerifyOtpInput): Promise<void> {
    const email = normalizeEmail(input.email);

    const isValid = await this.otpService.verify(email, input.otp);
    if (!isValid) {
      throw new InvalidOtpException();
    }
  }
}
