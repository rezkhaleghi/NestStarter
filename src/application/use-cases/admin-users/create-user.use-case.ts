import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserAlreadyExistsException } from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { normalizeEmail } from "../../utils/normalize-email";

export interface CreateAdminUserInput {
  email: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateAdminUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    if (await this.userRepository.findByEmail(email)) {
      throw new UserAlreadyExistsException(email);
    }

    const user = new User(
      randomUUID(),
      email,
      await this.passwordHasher.hash(input.password),
      input.role,
      true,
    );
    return this.userRepository.save(user);
  }
}
