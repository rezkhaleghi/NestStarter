import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import {
  InvalidCredentialsException,
  InvalidOtpException,
} from "../../../domain/exceptions/domain.exception";
import { OtpService } from "../../interfaces/otp.service.interface";
import { User } from "../../../domain/entities/user.entity";
import { normalizeEmail } from "../../utils/normalize-email";

@Injectable()
export class LoginWithOtpUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpService: OtpService,
  ) {}

  async execute(email: string, otp: string): Promise<User> {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isValid = await this.otpService.verify(normalizedEmail, otp);
    if (!isValid) {
      throw new InvalidOtpException();
    }

    if (!user.emailVerified) {
      user.verifyEmail();
      await this.userRepository.save(user);
    }

    return user;
  }
}
