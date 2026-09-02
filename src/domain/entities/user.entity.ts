import { UserStatus } from "@domain/enums/user-status.enum";
import { UserRole } from "../enums/user-role.enum";
import { GoogleAccountConflictException } from "../exceptions/domain.exception";

/**
 * Fields that can be updated as ordinary user profile data.
 *
 * This type intentionally does not include fields such as:
 * - role
 * - status
 * - emailVerified
 * - googleId
 * - hashedPassword
 *
 * Those fields have domain-specific behavior and should only be
 * changed through their dedicated domain methods.
 *
 * `undefined` means "do not change this field".
 * `null` means "explicitly clear this field".
 */
export type UpdateUserParams = Partial<{
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  dateOfBirth: Date | null;
  avatar: string | null;
  bio: string | null;
}>;

/**
 * Domain entity — represents the business truth about a User.
 *
 * No ORM decorators, no framework-specific persistence logic.
 * This class should be instantiable and testable with plain `new User(...)`.
 *
 * The entity owns business state and business behavior.
 * Persistence is handled by UserRepository.
 */
export class User {
  private _emailVerified: boolean;
  private _googleId: string | null;

  constructor(
    public readonly id: string,
    public email: string,
    public hashedPassword: string | null,
    public role: UserRole = UserRole.USER,
    emailVerified = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    googleId: string | null = null,

    // Ordinary profile fields can be changed through update().
    public firstName: string | null = null,
    public lastName: string | null = null,
    public userName: string | null = null,
    public dateOfBirth: Date | null = null,
    public avatar: string | null = null,
    public bio: string | null = null,

    // Status is changed through activate()/restrict().
    public status: UserStatus = UserStatus.ACTIVE,
  ) {
    this._emailVerified = emailVerified;
    this._googleId = googleId;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get googleId(): string | null {
    return this._googleId;
  }

  /**
   * Updates ordinary user profile fields.
   *
   * Only fields explicitly provided in `params` are changed.
   *
   * `undefined` = field was not provided → keep the current value.
   * `null`      = field was explicitly cleared → set it to null.
   *
   * Fields with special business rules such as status, role,
   * email verification, password, and Google account linking
   * are intentionally excluded from this method.
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
  }

  /**
   * Business operation with rules/invariants.
   *
   * Changes the user's email address.
   * Email normalization and uniqueness checks are handled
   * by the application/use-case layer before this operation.
   */
  changeEmail(email: string): void {
    this.email = email;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Changes the user's role.
   * Administrator-specific rules are enforced by the application
   * and repository layers.
   */
  changeRole(role: UserRole): void {
    this.role = role;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Changes the email verification state.
   */
  setEmailVerified(verified: boolean): void {
    this._emailVerified = verified;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Replaces the user's password with an already-hashed password.
   *
   * The domain never hashes passwords itself. Password hashing
   * is an infrastructure concern handled by PasswordHasher.
   */
  changePassword(hashedPassword: string): void {
    this.hashedPassword = hashedPassword;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Marks the user's email address as verified.
   */
  verifyEmail(): void {
    this._emailVerified = true;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Links a Google account to this user.
   * A different Google account cannot replace an already-linked account.
   */
  linkGoogleAccount(googleId: string): void {
    if (this.googleId && this.googleId !== googleId) {
      throw new GoogleAccountConflictException();
    }

    this._googleId = googleId;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Activates the user's account and allows normal authenticated access.
   */
  activate(): void {
    this.status = UserStatus.ACTIVE;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Restricts the user's account.
   * Authentication guards can use this state to prevent restricted
   * users from accessing protected functionality.
   */
  restrict(): void {
    this.status = UserStatus.RESTRICTED;
  }

  /**
   * Factory method for creating a new regular user.
   *
   * Creation rules are kept here so callers do not need to know
   * the constructor's internal argument order or default values.
   */
  static create(params: {
    id: string;
    email: string;
    hashedPassword: string | null;
    role?: UserRole;
    emailVerified?: boolean;
    googleId?: string;
  }): User {
    return new User(
      params.id,
      params.email,
      params.hashedPassword,
      params.role ?? UserRole.USER,
      params.emailVerified ?? false,
      new Date(),
      new Date(),
      params.googleId ?? null,
    );
  }
}
