import { Injectable } from "@nestjs/common";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import {
  CannotRemoveLastAdminException,
  UserAlreadyExistsException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";

export interface UpdateAdminUserInput {
  id: string;
  email?: string;
  password?: string;
  role?: UserRole;
  emailVerified?: boolean;
}

@Injectable()
export class UpdateAdminUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: UpdateAdminUserInput): Promise<User> {
    const existing = await this.userRepository.findById(input.id);
    if (!existing) {
      throw new UserNotFoundException();
    }

    if (input.email && input.email.toLowerCase() !== existing.email) {
      const email = input.email.toLowerCase();
      if (await this.userRepository.findByEmail(email)) {
        throw new UserAlreadyExistsException(email);
      }
    }

    if (
      existing.role === UserRole.ADMIN &&
      input.role === UserRole.USER &&
      (await this.userRepository.countByRole(UserRole.ADMIN)) <= 1
    ) {
      throw new CannotRemoveLastAdminException();
    }

    const updated = new User(
      existing.id,
      input.email?.toLowerCase() ?? existing.email,
      input.password
        ? await this.passwordHasher.hash(input.password)
        : existing.hashedPassword,
      input.role ?? existing.role,
      input.emailVerified ?? existing.emailVerified,
      existing.createdAt,
    );
    return this.userRepository.save(updated);
  }
}
