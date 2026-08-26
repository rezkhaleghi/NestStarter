import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../domain/repositories/user.repository";
import { InvalidCredentialsException } from "../../domain/exceptions/domain.exception";
import { PasswordHasher } from "../interfaces/password-hasher.interface";
import { OtpService } from "../interfaces/otp.service.interface";
import { LoginUserInput } from "../dtos/login-user.input";
import { User } from "../../domain/entities/user.entity";
import { InvalidOtpException } from "../../domain/exceptions/domain.exception";

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly otpService: OtpService,
  ) {}

  async loginEmail(input: LoginUserInput): Promise<User> {
    const user = await this.userRepository.findByEmail(
      input.email.trim().toLowerCase(),
    );
    if (!user?.hashedPassword) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.hashedPassword,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

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

    return user;
  }
}
