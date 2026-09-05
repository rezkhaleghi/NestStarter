import { Injectable } from "@nestjs/common";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserStatus } from "@domain/enums/user-status.enum";
import {
  CannotRemoveLastAdminException,
  UserAlreadyExistsException,
  UserNotFoundException,
  UsernameAlreadyExistsException,
} from "../../../domain/exceptions/domain.exception";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { normalizeEmail } from "../../utils/normalize-email";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { UnitOfWork } from "../../interfaces/unit-of-work.interface";

export interface UpdateAdminUserInput {
  id: string;

  // Account fields.
  email?: string;
  password?: string;
  role?: UserRole;
  emailVerified?: boolean;
  status?: UserStatus;

  // Ordinary profile fields.
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  dateOfBirth?: Date | null;
  bio?: string | null;
}

@Injectable()
export class UpdateAdminUserUseCase {
  constructor(
    private readonly passwordHasher: PasswordHasher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    input: UpdateAdminUserInput,
    actorUserId: string,
  ): Promise<User> {
    return this.unitOfWork.execute(
      async ({ userRepository, auditLogRepository }) => {
        const user = await userRepository.findById(input.id);

        if (!user) {
          throw new UserNotFoundException();
        }

        /**
         * Capture the original state before mutating the entity.
         *
         * This is required for:
         * - audit logging
         * - detecting actual changes
         * - determining whether the user was an admin before the mutation
         */
        const before = {
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          dateOfBirth: user.dateOfBirth,
          avatar: user.avatar,
          bio: user.bio,
          status: user.status,
        };

        /**
         * Must be captured before changing the role.
         *
         * The repository uses this value to protect against
         * removing the last administrator.
         */
        const wasAdmin = user.role === UserRole.ADMIN;

        // Normalize the email before comparing it.
        const email =
          input.email !== undefined ? normalizeEmail(input.email) : user.email;

        /**
         * Email addresses must be unique.
         *
         * This requires repository access and therefore does not
         * belong inside the domain entity.
         */
        if (email !== user.email) {
          const existingEmailUser = await userRepository.findByEmail(email);

          if (existingEmailUser && existingEmailUser.id !== user.id) {
            throw new UserAlreadyExistsException(email);
          }
        }

        /**
         * Usernames must also be unique.
         *
         * null explicitly removes the username.
         */
        if (
          input.userName !== undefined &&
          input.userName !== null &&
          input.userName !== user.userName
        ) {
          const existingUsernameUser = await userRepository.findByUserName(
            input.userName,
          );

          if (existingUsernameUser && existingUsernameUser.id !== user.id) {
            throw new UsernameAlreadyExistsException(input.userName);
          }
        }

        /**
         * Ordinary profile fields are changed through the domain entity.
         *
         * undefined → leave unchanged
         * null      → explicitly clear
         */
        user.update({
          firstName: input.firstName,
          lastName: input.lastName,
          userName: input.userName,
          dateOfBirth: input.dateOfBirth,
          bio: input.bio,
        });

        // Email is changed through its dedicated domain operation.
        if (email !== user.email) {
          user.changeEmail(email);
        }

        /**
         * Passwords are hashed outside the domain.
         * The domain only receives the resulting hash.
         */
        if (input.password !== undefined) {
          const hashedPassword = await this.passwordHasher.hash(input.password);

          user.changePassword(hashedPassword);
        }

        // Email verification is a dedicated domain operation.
        if (
          input.emailVerified !== undefined &&
          input.emailVerified !== user.emailVerified
        ) {
          user.setEmailVerified(input.emailVerified);
        }

        // Role changes are handled through the domain operation.
        if (input.role !== undefined && input.role !== user.role) {
          user.changeRole(input.role);
        }

        /**
         * Account status changes use explicit domain operations.
         */
        if (input.status !== undefined && input.status !== user.status) {
          if (input.status === UserStatus.ACTIVE) {
            user.activate();
          } else if (input.status === UserStatus.RESTRICTED) {
            user.restrict();
          }
        }

        /**
         * Persist the mutated domain entity.
         *
         * The repository handles the transaction required when
         * an administrator is demoted.
         */
        const saved = await userRepository.saveAdminMutation(user, wasAdmin);

        if (!saved) {
          throw new CannotRemoveLastAdminException();
        }

        /**
         * Build a record containing only ordinary fields that changed.
         *
         * Compare against `before`, not `user`, because `user` has
         * already been mutated at this point.
         */
        const changes: Record<string, unknown> = {};

        if (before.email !== saved.email) {
          changes.email = {
            from: before.email,
            to: saved.email,
          };
        }

        if (before.emailVerified !== saved.emailVerified) {
          changes.emailVerified = {
            from: before.emailVerified,
            to: saved.emailVerified,
          };
        }

        if (before.firstName !== saved.firstName) {
          changes.firstName = {
            from: before.firstName,
            to: saved.firstName,
          };
        }

        if (before.lastName !== saved.lastName) {
          changes.lastName = {
            from: before.lastName,
            to: saved.lastName,
          };
        }

        if (before.userName !== saved.userName) {
          changes.userName = {
            from: before.userName,
            to: saved.userName,
          };
        }

        if (before.dateOfBirth?.getTime() !== saved.dateOfBirth?.getTime()) {
          changes.dateOfBirth = {
            from: before.dateOfBirth,
            to: saved.dateOfBirth,
          };
        }

        if (before.avatar !== saved.avatar) {
          changes.avatar = {
            from: before.avatar,
            to: saved.avatar,
          };
        }

        if (before.bio !== saved.bio) {
          changes.bio = {
            from: before.bio,
            to: saved.bio,
          };
        }

        if (before.status !== saved.status) {
          changes.status = {
            from: before.status,
            to: saved.status,
          };
        }

        /**
         * Record ordinary account/profile changes.
         */
        if (Object.keys(changes).length > 0) {
          await auditLogRepository.create(
            AuditLog.create({
              actorUserId,
              targetUserId: saved.id,
              action: AuditAction.USER_UPDATED,
              metadata: {
                changes,
              },
            }),
          );
        }

        /**
         * Password changes get their own audit action.
         *
         * Never store the password or password hash.
         */
        if (input.password !== undefined) {
          await auditLogRepository.create(
            AuditLog.create({
              actorUserId,
              targetUserId: saved.id,
              action: AuditAction.USER_PASSWORD_CHANGED,
              metadata: {
                email: saved.email,
              },
            }),
          );
        }

        /**
         * Role changes get their own audit action because they are
         * security-sensitive administrative operations.
         */
        if (before.role !== saved.role) {
          await auditLogRepository.create(
            AuditLog.create({
              actorUserId,
              targetUserId: saved.id,
              action: AuditAction.USER_ROLE_CHANGED,
              metadata: {
                from: before.role,
                to: saved.role,
              },
            }),
          );
        }

        return saved;
      },
    );
  }
}
