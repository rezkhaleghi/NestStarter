import { UserRole } from "../enums/user-role.enum";

/**
 * Domain entity — represents business truth about a User.
 * No ORM decorators, no framework imports. This class should be
 * instantiable and testable with plain `new User(...)`.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly hashedPassword: string | null,
    public readonly role: UserRole = UserRole.USER,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(params: {
    id: string;
    email: string;
    hashedPassword: string | null;
  }): User {
    return new User(params.id, params.email, params.hashedPassword);
  }
}
