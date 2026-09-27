import { randomUUID } from "crypto";

import { UserStatus } from "@domain/enums/user-status.enum";
import { UserRole } from "../enums/user-role.enum";
import { GoogleAccountConflictException } from "../exceptions/domain.exception";

/**
 * Fields that can be changed through a normal profile update.
 *
 * Fields with their own business rules (role, status, password,
 * email verification, Google account) intentionally cannot be
 * changed through this method.
 *
 * `undefined` means "do not change".
 * `null` means "explicitly clear the value".
 */
export type UpdateUserParams = Partial<{
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  dateOfBirth: Date | null;
  avatar: string | null;
  bio: string | null;
}>;

export interface CreateUserProps {
  id?: string;
  email: string;
  hashedPassword: string | null;
  role?: UserRole;
  emailVerified?: boolean;
  googleId?: string | null;
}

export interface RestoreUserProps {
  id: string;
  email: string;
  hashedPassword: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  googleId: string | null;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  dateOfBirth: Date | null;
  avatar: string | null;
  bio: string | null;
  status: UserStatus;
}

/**
 * Domain entity representing the business state of a User.
 *
 * This class deliberately contains no ORM decorators or persistence
 * concerns. Database mapping belongs to the infrastructure layer.
 *
 * Construction is restricted to `create()` and `restore()` so callers
 * cannot accidentally bypass the entity's intended creation/recovery
 * paths.
 */
export class User {
  private _emailVerified: boolean;
  private _googleId: string | null;
  private _updatedAt: Date;

  /**
   * Private constructor prevents arbitrary construction from outside
   * the domain entity.
   *
   * New users should use `User.create()`.
   * Existing users loaded from persistence should use `User.restore()`.
   */
  private constructor(
    public readonly id: string,
    public email: string,
    public hashedPassword: string | null,
    public role: UserRole,
    emailVerified: boolean,
    public readonly createdAt: Date,
    updatedAt: Date,
    googleId: string | null,
    public firstName: string | null,
    public lastName: string | null,
    public userName: string | null,
    public dateOfBirth: Date | null,
    public avatar: string | null,
    public bio: string | null,
    public status: UserStatus,
  ) {
    this._emailVerified = emailVerified;
    this._googleId = googleId;
    this._updatedAt = updatedAt;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get googleId(): string | null {
    return this._googleId;
  }

  /**
   * The domain owns updatedAt.
   *
   * Keeping this mutable internally prevents the domain object from
   * carrying a stale timestamp after a business state change.
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Marks the entity as modified.
   *
   * This is intentionally private: only domain operations that actually
   * mutate the entity should be able to advance updatedAt.
   */
  private touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Creates a brand-new User.
   *
   * Creation defaults belong here instead of being scattered across
   * controllers, use cases, or persistence code.
   */
  static create(params: CreateUserProps): User {
    const now = new Date();

    return new User(
      params.id ?? randomUUID(),
      params.email,
      params.hashedPassword,
      params.role ?? UserRole.USER,
      params.emailVerified ?? false,
      now,
      now,
      params.googleId ?? null,
      null,
      null,
      null,
      null,
      null,
      null,
      UserStatus.ACTIVE,
    );
  }

  /**
   * Reconstitutes an existing User from persistence.
   *
   * Unlike create(), this method must preserve the exact persisted state,
   * including IDs, timestamps, profile data, role, and account status.
   *
   * It must not apply creation defaults or modify updatedAt.
   */
  static restore(params: RestoreUserProps): User {
    return new User(
      params.id,
      params.email,
      params.hashedPassword,
      params.role,
      params.emailVerified,
      params.createdAt,
      params.updatedAt,
      params.googleId,
      params.firstName,
      params.lastName,
      params.userName,
      params.dateOfBirth,
      params.avatar,
      params.bio,
      params.status,
    );
  }

  /**
   * Updates ordinary profile information.
   *
   * `undefined` keeps the current value.
   * `null` explicitly clears the value.
   *
   * Sensitive/business-controlled fields are intentionally excluded.
   */
  update(params: UpdateUserParams): void {
    if (params.firstName !== undefined) {
      this.firstName = params.firstName;
    }

    if (params.lastName !== undefined) {
      this.lastName = params.lastName;
    }

    if (params.userName !== undefined) {
      this.userName = params.userName;
    }

    if (params.dateOfBirth !== undefined) {
      this.dateOfBirth = params.dateOfBirth;
    }

    if (params.avatar !== undefined) {
      this.avatar = params.avatar;
    }

    if (params.bio !== undefined) {
      this.bio = params.bio;
    }

    this.touch();
  }

  /**
   * Changes the user's email.
   *
   * Email normalization and uniqueness checks belong to the
   * application/infrastructure layers.
   */
  changeEmail(email: string): void {
    this.email = email;
    this.touch();
  }

  /**
   * Changes the user's role.
   *
   * Authorization for who is allowed to perform this operation belongs
   * to the application layer; the entity owns the state transition.
   */
  changeRole(role: UserRole): void {
    this.role = role;
    this.touch();
  }

  /**
   * Changes the email verification state.
   */
  setEmailVerified(verified: boolean): void {
    this._emailVerified = verified;
    this.touch();
  }

  /**
   * Replaces the user's password with an already-hashed password.
   *
   * Password hashing is deliberately not performed inside the domain.
   */
  changePassword(hashedPassword: string): void {
    this.hashedPassword = hashedPassword;
    this.touch();
  }

  /**
   * Marks the user's email as verified.
   */
  verifyEmail(): void {
    this._emailVerified = true;
    this.touch();
  }

  /**
   * Links a Google account.
   *
   * Once a Google account is linked, a different Google account cannot
   * silently replace it.
   */
  linkGoogleAccount(googleId: string): void {
    if (this.googleId && this.googleId !== googleId) {
      throw new GoogleAccountConflictException();
    }

    this._googleId = googleId;
    this.touch();
  }

  /**
   * Activates the user account.
   */
  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  /**
   * Restricts the user account.
   *
   * Authentication/authorization layers can use this state to prevent
   * restricted users from accessing protected functionality.
   */
  restrict(): void {
    this.status = UserStatus.RESTRICTED;
    this.touch();
  }
}
