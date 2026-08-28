import { Injectable } from "@nestjs/common";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import {
  CannotRemoveLastAdminException,
  UserAlreadyExistsException,
  UserNotFoundException,
  UsernameAlreadyExistsException,
} from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { normalizeEmail } from "../../utils/normalize-email";

export interface UpdateAdminUserInput {
  id: string;
  email?: string;
  password?: string;
  role?: UserRole;
  emailVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  dateOfBirth?: Date | null;
  bio?: string | null;
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

    const email = input.email ? normalizeEmail(input.email) : existing.email;
    if (email !== existing.email) {
      if (await this.userRepository.findByEmail(email)) {
        throw new UserAlreadyExistsException(email);
      }
    }
    if (
      input.userName &&
      input.userName !== existing.userName &&
      (await this.userRepository.findByUserName(input.userName))
    ) {
      throw new UsernameAlreadyExistsException(input.userName);
    }

    const updated = new User(
      existing.id,
      email,
      input.password
        ? await this.passwordHasher.hash(input.password)
        : existing.hashedPassword,
      input.role ?? existing.role,
      input.emailVerified ?? existing.emailVerified,
      existing.createdAt,
      existing.updatedAt,
      existing.googleId,
      input.firstName === undefined ? existing.firstName : input.firstName,
      input.lastName === undefined ? existing.lastName : input.lastName,
      input.userName === undefined ? existing.userName : input.userName,
      input.dateOfBirth === undefined
        ? existing.dateOfBirth
        : input.dateOfBirth,
      existing.avatar,
      input.bio === undefined ? existing.bio : input.bio,
    );

    const saved = await this.userRepository.saveAdminMutation(
      updated,
      existing.role === UserRole.ADMIN,
    );
    if (!saved) {
      throw new CannotRemoveLastAdminException();
    }
    return saved;
  }
}
