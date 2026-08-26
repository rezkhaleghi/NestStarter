import { User } from "../entities/user.entity";

/**
 * Repository CONTRACT only — no implementation here.
 * Domain and application layers depend on this interface, never on
 * TypeORM/Prisma directly. Infrastructure provides the real implementation.
 */
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findAll(params: { offset: number; limit: number }): Promise<User[]>;
  abstract count(): Promise<number>;
  abstract countByRole(role: string): Promise<number>;
  abstract save(user: User): Promise<User>;
  abstract deleteById(id: string): Promise<void>;
}
