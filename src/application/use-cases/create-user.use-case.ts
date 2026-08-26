import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { UserRepository } from "../../domain/repositories/user.repository";
import { User } from "../../domain/entities/user.entity";
import { PasswordHasher } from "../interfaces/password-hasher.interface";
import { CreateUserInput } from "../dtos/create-user.input";
import { UserAlreadyExistsException } from "../../domain/exceptions/domain.exception";

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsException(email);
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);
    const user = User.create({
      id: randomUUID(),
      email,
      hashedPassword,
    });

    return this.userRepository.save(
      new User(user.id, user.email, user.hashedPassword, user.role, true),
    );
  }
}
