import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../domain/repositories/user.repository";
import { InvalidCredentialsException } from "../../domain/exceptions/domain.exception";
import { PasswordHasher } from "../interfaces/password-hasher.interface";
import { OtpService } from "../interfaces/otp.service.interface";
import { LoginUserInput } from "../dtos/login-user.input";
import { User } from "../../domain/entities/user.entity";
import { InvalidOtpException } from "../../domain/exceptions/domain.exception";
import { LoginProtection } from "../interfaces/login-protection.interface";

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly otpService: OtpService,
    private readonly loginProtection: LoginProtection,
  ) {}

  async loginPassword(input: LoginUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();
    if (await this.loginProtection.isLocked(email)) {
      throw new InvalidCredentialsException();
    }
    const user = await this.userRepository.findByEmail(email);
    if (!user?.hashedPassword) {
      await this.loginProtection.recordFailure(email);
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.hashedPassword,
    );
    if (!passwordMatches) {
      await this.loginProtection.recordFailure(email);
      throw new InvalidCredentialsException();
    }

    await this.loginProtection.clear(email);

    return user;
  }

  async loginOtp(email: string, otp: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isValid = await this.otpService.verify(normalizedEmail, otp);
    if (!isValid) {
      throw new InvalidOtpException();
    }

    if (!user.emailVerified) {
      user.emailVerified = true;
      await this.userRepository.save(user);
    }

    return user;
  }
}
