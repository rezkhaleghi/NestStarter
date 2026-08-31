import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user.entity";
import { GoogleAuthInput } from "../../dtos/google-auth.input";
import { normalizeEmail } from "../../utils/normalize-email";
import { UserStatus } from "@domain/enums/user-status.enum";
import { InvalidCredentialsException } from "@domain/exceptions/domain.exception";

@Injectable()
export class GoogleAuthUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GoogleAuthInput): Promise<User> {
    const email = normalizeEmail(input.email);
    const linkedUser = await this.userRepository.findByGoogleId(input.googleId);

    if (linkedUser) {
      if (linkedUser.status !== UserStatus.ACTIVE) {
        throw new InvalidCredentialsException();
      }

      return linkedUser;
    }

    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      if (existing.status !== UserStatus.ACTIVE) {
        throw new InvalidCredentialsException();
      }

      existing.linkGoogleAccount(input.googleId);

      if (!existing.emailVerified) {
        existing.verifyEmail();
      }

      return this.userRepository.save(existing);
    }

    const user = User.create({
      id: randomUUID(),
      email,
      hashedPassword: null,
      googleId: input.googleId,
    });
    user.verifyEmail();
    return this.userRepository.save(user);
  }
}
