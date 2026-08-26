import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user.entity";
import { UserOrmEntity } from "../orm-entities/user.orm-entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import {
  PageQuery,
  PageResult,
} from "../../../application/dtos/page-query.input";

/**
 * Concrete implementation of the domain's UserRepository contract.
 * This is the ONLY place that translates between the domain entity
 * and the ORM entity — that translation logic (toDomain/toOrm) never
 * leaks into domain or application.
 */
@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repo.findOne({
      where: { email: email.toLowerCase() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findPage(
    params: PageQuery<"createdAt" | "email" | "role">,
  ): Promise<PageResult<User>> {
    const [rows, total] = await this.repo.findAndCount({
      order: { [params.sortBy ?? "createdAt"]: params.sortDirection ?? "DESC" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
    return {
      data: rows.map((row) => this.toDomain(row)),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async countByRole(role: string): Promise<number> {
    return this.repo.count({ where: { role: role as UserRole } });
  }

  async save(user: User): Promise<User> {
    const row = this.toOrm(user);
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(row: UserOrmEntity): User {
    return new User(
      row.id,
      row.email,
      row.hashedPassword,
      row.role,
      row.emailVerified,
      row.createdAt,
      row.updatedAt,
    );
  }

  private toOrm(user: User): UserOrmEntity {
    const row = new UserOrmEntity();
    row.id = user.id;
    row.email = user.email;
    row.hashedPassword = user.hashedPassword;
    row.role = user.role;
    row.emailVerified = user.emailVerified;
    row.createdAt = user.createdAt;
    row.updatedAt = user.updatedAt;
    return row;
  }
}
