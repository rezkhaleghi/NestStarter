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
import { UserRepository } from "../../../domain/repositories/user.repository";
import {
  AuditAction,
  AuditLogger,
} from "../../interfaces/audit-logger.interface";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { normalizeEmail } from "../../utils/normalize-email";

/**
 * Input used by administrators to update a user.
 *
 * `undefined` means the field was not provided and should remain unchanged.
 * `null` means the field was explicitly cleared.
 *
 * Admins can modify both ordinary profile fields and
 * domain-specific account fields.
 */
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

/**
 * Updates an existing user using administrator privileges.
 *
 * The use case coordinates the operation:
 * - loads the user
 * - validates data that requires repository access
 * - hashes passwords
 * - invokes domain operations
 * - persists the entity
 * - records the audit log
 *
 * The User entity owns the user's state and domain behavior.
 * The repository owns persistence and database-level concurrency rules.
 */
@Injectable()
export class UpdateAdminUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditLogger: AuditLogger,
  ) {}

  /**
   * Executes an administrator update against an existing user.
   */
  async execute(
    input: UpdateAdminUserInput,
    actorUserId: string,
  ): Promise<User> {
    // Load the target user before applying any changes.
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new UserNotFoundException();
    }

    /**
     * Normalize the email before comparing it with the existing value.
     *
     * If no new email was provided, keep the existing email.
     */
    const email =
      input.email !== undefined ? normalizeEmail(input.email) : user.email;

    /**
     * Email addresses must be unique.
     *
     * The repository is used here because checking another user's
     * existence is a persistence/application concern, not an entity concern.
     */
    if (email !== user.email) {
      const existingEmailUser = await this.userRepository.findByEmail(email);

      if (existingEmailUser && existingEmailUser.id !== user.id) {
        throw new UserAlreadyExistsException(email);
      }
    }

    /**
     * Usernames must also be unique.
     *
     * `null` means the administrator wants to remove the username,
     * so no uniqueness lookup is required.
     */
    if (
      input.userName !== undefined &&
      input.userName !== null &&
      input.userName !== user.userName
    ) {
      const existingUsernameUser = await this.userRepository.findByUserName(
        input.userName,
      );

      if (existingUsernameUser && existingUsernameUser.id !== user.id) {
        throw new UsernameAlreadyExistsException(input.userName);
      }
    }

    /**
     * Update ordinary profile fields through the domain entity.
     *
     * The entity handles the distinction between:
     * - undefined → leave the field unchanged
     * - null      → explicitly clear the field
     */
    user.update({
      firstName: input.firstName,
      lastName: input.lastName,
      userName: input.userName,
      dateOfBirth: input.dateOfBirth,
      bio: input.bio,
    });

    /**
     * Email is a domain-specific operation rather than an ordinary
     * profile update.
     *
     * Email normalization and uniqueness validation were already
     * performed above.
     */
    if (email !== user.email) {
      // Business operation with rules/invariants.
      user.changeEmail(email);
    }

    /**
     * Passwords must be hashed before entering the domain entity.
     *
     * The domain receives only the resulting password hash.
     */
    if (input.password !== undefined) {
      const hashedPassword = await this.passwordHasher.hash(input.password);

      // Business operation with rules/invariants.
      user.changePassword(hashedPassword);
    }

    /**
     * Email verification is a domain-specific state change.
     *
     * We use the domain operation rather than directly modifying
     * the entity's internal verification state.
     */
    if (
      input.emailVerified !== undefined &&
      input.emailVerified !== user.emailVerified
    ) {
      // Business operation with rules/invariants.
      user.setEmailVerified(input.emailVerified);
    }

    /**
     * Role changes are domain-specific.
     *
     * The entity changes its own role, while the repository later
     * protects the last-administrator invariant transactionally.
     */
    if (input.role !== undefined && input.role !== user.role) {
      // Business operation with rules/invariants.
      user.changeRole(input.role);
    }

    /**
     * Account status changes use explicit domain operations.
     *
     * This keeps ACTIVE and RESTRICTED as meaningful business states
     * instead of treating status as an ordinary editable property.
     */
    if (input.status !== undefined && input.status !== user.status) {
      if (input.status === UserStatus.ACTIVE) {
        // Business operation with rules/invariants.
        user.activate();
      } else if (input.status === UserStatus.RESTRICTED) {
        // Business operation with rules/invariants.
        user.restrict();
      }
    }

    /**
     * Remember whether the user was an administrator BEFORE the mutation.
     *
     * This is important because the repository needs to know whether
     * the role change could potentially remove the last administrator.
     */
    const wasAdmin = user.role === UserRole.ADMIN;

    /**
     * Persist the already-mutated domain entity.
     *
     * saveAdminMutation() handles the administrator-specific database
     * transaction and protects against concurrent last-admin removal.
     */
    const saved = await this.userRepository.saveAdminMutation(user, wasAdmin);

    if (!saved) {
      throw new CannotRemoveLastAdminException();
    }

    /**
     * Build an audit record containing only fields that actually changed.
     *
     * Never store the actual password or password hash in the audit log.
     */
    const changes: Record<string, unknown> = {};

    if (user.email !== saved.email) {
      changes.email = {
        from: user.email,
        to: saved.email,
      };
    }

    if (user.role !== saved.role) {
      changes.role = {
        from: user.role,
        to: saved.role,
      };
    }

    if (user.emailVerified !== saved.emailVerified) {
      changes.emailVerified = {
        from: user.emailVerified,
        to: saved.emailVerified,
      };
    }

    if (user.firstName !== saved.firstName) {
      changes.firstName = {
        from: user.firstName,
        to: saved.firstName,
      };
    }

    if (user.lastName !== saved.lastName) {
      changes.lastName = {
        from: user.lastName,
        to: saved.lastName,
      };
    }

    if (user.userName !== saved.userName) {
      changes.userName = {
        from: user.userName,
        to: saved.userName,
      };
    }

    if (user.dateOfBirth?.getTime() !== saved.dateOfBirth?.getTime()) {
      changes.dateOfBirth = {
        from: user.dateOfBirth,
        to: saved.dateOfBirth,
      };
    }

    if (user.avatar !== saved.avatar) {
      changes.avatar = {
        from: user.avatar,
        to: saved.avatar,
      };
    }

    if (user.bio !== saved.bio) {
      changes.bio = {
        from: user.bio,
        to: saved.bio,
      };
    }

    if (input.password !== undefined) {
      changes.password = "changed";
    }

    if (user.status !== saved.status) {
      changes.status = {
        from: user.status,
        to: saved.status,
      };
    }

    /**
     * Record the administrative operation only after persistence
     * has completed successfully.
     */
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
