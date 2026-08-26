import { User } from "../entities/user.entity";
import { PageQuery, PageResult } from "../../application/dtos/page-query.input";

/**
 * Repository CONTRACT only — no implementation here.
 * Domain and application layers depend on this interface, never on
 * TypeORM/Prisma directly. Infrastructure provides the real implementation.
 */
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByGoogleId(googleId: string): Promise<User | null>;
  abstract findByUserName(userName: string): Promise<User | null>;
  abstract findPage(
    params: PageQuery<"createdAt" | "email" | "role">,
  ): Promise<PageResult<User>>;
  abstract countByRole(role: string): Promise<number>;
  abstract save(user: User): Promise<User>;
  abstract saveAdminMutation(
    user: User,
    wasAdmin: boolean,
  ): Promise<User | null>;
  abstract deleteAdminUser(id: string): Promise<boolean>;
  abstract deleteById(id: string): Promise<void>;
}
