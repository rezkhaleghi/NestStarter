import { UserRole } from "../enums/user-role.enum";
import { GoogleAccountConflictException } from "../exceptions/domain.exception";

/**
 * Domain entity — represents business truth about a User.
 * No ORM decorators, no framework imports. This class should be
 * instantiable and testable with plain `new User(...)`.
 */
export class User {
  private _emailVerified: boolean;
  private _googleId: string | null;

  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly hashedPassword: string | null,
    public readonly role: UserRole = UserRole.USER,
    emailVerified = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    googleId: string | null = null,
    public readonly firstName: string | null = null,
    public readonly lastName: string | null = null,
    public readonly userName: string | null = null,
    public readonly dateOfBirth: Date | null = null,
  ) {
    this._emailVerified = emailVerified;
    this._googleId = googleId;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  verifyEmail(): void {
    this._emailVerified = true;
  }

  get googleId(): string | null {
    return this._googleId;
  }

  linkGoogleAccount(googleId: string): void {
    if (this.googleId && this.googleId !== googleId) {
      throw new GoogleAccountConflictException();
    }
    this._googleId = googleId;
  }

  static create(params: {
    id: string;
    email: string;
    hashedPassword: string | null;
    googleId?: string;
  }): User {
    return new User(
      params.id,
      params.email,
      params.hashedPassword,
      UserRole.USER,
      false,
      new Date(),
      new Date(),
      params.googleId ?? null,
    );
  }
}
