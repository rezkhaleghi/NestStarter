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
import {
  AuditAction,
  AuditLogger,
} from "../../interfaces/audit-logger.interface";
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
    private readonly auditLogger: AuditLogger,
  ) {}

  async execute(
    input: UpdateAdminUserInput,
    actorUserId: string,
  ): Promise<User> {
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

    const changes: Record<string, unknown> = {};

    if (existing.email !== saved.email) {
      changes.email = {
        from: existing.email,
        to: saved.email,
      };
    }

    if (existing.role !== saved.role) {
      changes.role = {
        from: existing.role,
        to: saved.role,
      };
    }

    if (existing.emailVerified !== saved.emailVerified) {
      changes.emailVerified = {
        from: existing.emailVerified,
        to: saved.emailVerified,
      };
    }

    if (existing.firstName !== saved.firstName) {
      changes.firstName = {
        from: existing.firstName,
        to: saved.firstName,
      };
    }

    if (existing.lastName !== saved.lastName) {
      changes.lastName = {
        from: existing.lastName,
        to: saved.lastName,
      };
    }

    if (existing.userName !== saved.userName) {
      changes.userName = {
        from: existing.userName,
        to: saved.userName,
      };
    }

    if (existing.dateOfBirth?.getTime() !== saved.dateOfBirth?.getTime()) {
      changes.dateOfBirth = {
        from: existing.dateOfBirth,
        to: saved.dateOfBirth,
      };
    }

    if (existing.bio !== saved.bio) {
      changes.bio = {
        from: existing.bio,
        to: saved.bio,
      };
    }

    if (input.password !== undefined) {
      changes.password = "changed";
    }

    await this.auditLogger.log({
      actorUserId,
      targetUserId: saved.id,
      action: AuditAction.USER_UPDATED,
      metadata: {
        changes,
      },
    });

    return saved;
  }
}
