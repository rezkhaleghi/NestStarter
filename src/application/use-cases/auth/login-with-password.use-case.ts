import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { InvalidCredentialsException } from "../../../domain/exceptions/domain.exception";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { LoginUserInput } from "../../dtos/login-user.input";
import { User } from "../../../domain/entities/user.entity";
import { LoginProtection } from "../../interfaces/login-protection.interface";
import { normalizeEmail } from "../../utils/normalize-email";

@Injectable()
export class LoginWithPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly loginProtection: LoginProtection,
  ) {}

  async execute(input: LoginUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
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
}
