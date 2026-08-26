import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { GoogleAuthInput } from '../dtos/google-auth.input';

/**
 * Find-or-create flow for Google sign-in/sign-up.
 * Reuses the SAME UserRepository interface as CreateUserUseCase —
 * no new repository needed. hashedPassword is null for Google users.
 */
@Injectable()
export class GoogleAuthUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GoogleAuthInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      return existing;
    }

    const user = User.create({
      id: randomUUID(),
      email: input.email,
      hashedPassword: null,
    });

    return this.userRepository.save(user);
  }
}
