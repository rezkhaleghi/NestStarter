import { Injectable } from "@nestjs/common";
import { User } from "../../domain/entities/user.entity";
import { UserNotFoundException } from "../../domain/exceptions/domain.exception";
import { UserRepository } from "../../domain/repositories/user.repository";
import { PasswordHasher } from "../interfaces/password-hasher.interface";

export interface ChangeUserPasswordInput {
  userId: string;
  password: string;
}

@Injectable()
export class ChangeUserPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangeUserPasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const updated = new User(
      user.id,
      user.email,
      await this.passwordHasher.hash(input.password),
      user.role,
      user.createdAt,
      user.updatedAt,
    );
    await this.userRepository.save(updated);
  }
}
