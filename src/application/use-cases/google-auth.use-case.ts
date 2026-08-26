import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { UserRepository } from "../../domain/repositories/user.repository";
import { User } from "../../domain/entities/user.entity";
import { GoogleAuthInput } from "../dtos/google-auth.input";
import { normalizeEmail } from "../utils/normalize-email";

/**
 * Find-or-create flow for Google sign-in/sign-up.
 * Reuses the SAME UserRepository interface as CreateUserUseCase —
 * no new repository needed. hashedPassword is null for Google users.
 */
@Injectable()
export class GoogleAuthUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GoogleAuthInput): Promise<User> {
    const email = normalizeEmail(input.email);
    const linkedUser = await this.userRepository.findByGoogleId(input.googleId);
    if (linkedUser) {
      return linkedUser;
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
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
