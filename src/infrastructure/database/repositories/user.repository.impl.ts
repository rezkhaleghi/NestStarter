import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../domain/entities/user.entity";
import { UserOrmEntity } from "../orm-entities/user.orm-entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import {
  PageQuery,
  PageResult,
} from "../../../application/dtos/page-query.input";
import { UserSearchResult } from "../../../application/dtos/user-search-result";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { AdminUserSearchFilters } from "../../../application/dtos/admin-user-search-filters";

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

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { googleId } });
    return row ? this.toDomain(row) : null;
  }

  async findByUserName(userName: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { userName } });
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

  async saveAdminMutation(user: User, wasAdmin: boolean): Promise<User | null> {
    if (!wasAdmin || user.role === UserRole.ADMIN) {
      return this.save(user);
    }

    return this.repo.manager.transaction(async (manager) => {
      const admins = await manager.find(UserOrmEntity, {
        where: { role: UserRole.ADMIN },
        lock: { mode: "pessimistic_write" },
      });
      if (admins.length <= 1) {
        return null;
      }
      const saved = await manager.save(UserOrmEntity, this.toOrm(user));
      return this.toDomain(saved);
    });
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      const admins = await manager.find(UserOrmEntity, {
        where: { role: UserRole.ADMIN },
        lock: { mode: "pessimistic_write" },
      });
      const user = await manager.findOne(UserOrmEntity, { where: { id } });
      if (!user) {
        return false;
      }
      if (user.role === UserRole.ADMIN && admins.length <= 1) {
        return false;
      }
      await manager.delete(UserOrmEntity, id);
      return true;
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async search(
    query: string,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<UserSearchResult>> {
    const normalizedQuery = query.trim().toLowerCase();

    const qb = this.repo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.userName",
        "user.avatar",
        "user.bio",
        "user.email",
        "user.dateOfBirth",
        "user.createdAt",
      ]);

    const nameParts = normalizedQuery.split(/\s+/);
    const firstNameQuery = nameParts[0];
    const lastNameQuery = nameParts.slice(1).join(" ");

    qb.where(
      `
      user.email ILIKE :exactEmail
      OR user.userName ILIKE :prefix
      OR user.firstName ILIKE :prefix
      OR user.lastName ILIKE :prefix
    `,
      {
        exactEmail: normalizedQuery,
        prefix: `${normalizedQuery}%`,
      },
    );

    // Support full-name searches such as:
    // "john doe" → firstName starts with "john" AND lastName starts with "doe"
    if (nameParts.length >= 2) {
      qb.orWhere(
        `
        user.firstName ILIKE :firstNamePrefix
        AND user.lastName ILIKE :lastNamePrefix
      `,
        {
          firstNamePrefix: `${firstNameQuery}%`,
          lastNamePrefix: `${lastNameQuery}%`,
        },
      );
    }

    qb.addSelect(
      `
      CASE
        WHEN user.email ILIKE :exactEmail THEN 1
        WHEN user.userName ILIKE :exactUsername THEN 2
        WHEN user.userName ILIKE :prefix THEN 3
        WHEN user.firstName ILIKE :exactName THEN 4
        WHEN user.lastName ILIKE :exactName THEN 5
        WHEN user.firstName ILIKE :prefix THEN 6
        WHEN user.lastName ILIKE :prefix THEN 7
        WHEN (
          user.firstName ILIKE :firstNamePrefix
          AND user.lastName ILIKE :lastNamePrefix
        ) THEN 8
        ELSE 9
      END
    `,
      "search_rank",
    );

    qb.setParameters({
      exactEmail: normalizedQuery,
      exactUsername: normalizedQuery,
      exactName: normalizedQuery,
      prefix: `${normalizedQuery}%`,
      firstNamePrefix: `${firstNameQuery}%`,
      lastNamePrefix: `${lastNameQuery}%`,
    });

    qb.orderBy("search_rank", "ASC");
    qb.addOrderBy("user.createdAt", "DESC");

    const [rows, total] = await qb
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();

    return {
      data: rows.map((row) => ({
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        userName: row.userName,
        avatar: row.avatar,
        bio: row.bio,
        email: row.email,
        dateOfBirth: row.dateOfBirth,
        createdAt: row.createdAt,
      })),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async searchAdminUsers(
    filters: AdminUserSearchFilters,
    params: PageQuery<"createdAt" | "email" | "role">,
  ): Promise<PageResult<User>> {
    const qb = this.repo.createQueryBuilder("user");

    if (filters.search?.trim()) {
      const normalizedSearch = filters.search.trim();

      const nameParts = normalizedSearch.split(/\s+/);

      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");

        qb.andWhere(
          `
        (
          user.email ILIKE :exactEmail
          OR user.userName ILIKE :prefix
          OR user.firstName ILIKE :prefix
          OR user.lastName ILIKE :prefix
          OR (
            user.firstName ILIKE :firstName
            AND user.lastName ILIKE :lastName
          )
        )
        `,
          {
            exactEmail: normalizedSearch,
            prefix: `${normalizedSearch}%`,
            firstName: `${firstName}%`,
            lastName: `${lastName}%`,
          },
        );
      } else {
        qb.andWhere(
          `
        (
          user.email ILIKE :exactEmail
          OR user.userName ILIKE :prefix
          OR user.firstName ILIKE :prefix
          OR user.lastName ILIKE :prefix
        )
        `,
          {
            exactEmail: normalizedSearch,
            prefix: `${normalizedSearch}%`,
          },
        );
      }
    }

    if (filters.role) {
      qb.andWhere("user.role = :role", {
        role: filters.role,
      });
    }

    if (filters.emailVerified !== undefined) {
      qb.andWhere("user.emailVerified = :emailVerified", {
        emailVerified: filters.emailVerified,
      });
    }

    qb.orderBy(
      `user.${params.sortBy ?? "createdAt"}`,
      params.sortDirection ?? "DESC",
    );

    // Stable ordering when two users have the same primary sort value.
    qb.addOrderBy("user.id", "ASC");

    const [rows, total] = await qb
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();

    return {
      data: rows.map((row) => this.toDomain(row)),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Converts a TypeORM entity into the domain User entity.
   *
   * ORM entities belong to the infrastructure layer and should
   * never leak into the domain or application layers.
   *
   * Database → ORM Entity → Domain Entity
   */
  private toDomain(row: UserOrmEntity): User {
    return new User(
      row.id,
      row.email,
      row.hashedPassword,
      row.role,
      row.emailVerified,
      row.createdAt,
      row.updatedAt,
      row.googleId,
      row.firstName,
      row.lastName,
      row.userName,
      row.dateOfBirth,
      row.avatar,
      row.bio,
    );
  }

  /**
   * Converts a domain User into a TypeORM entity.
   *
   * This keeps ORM-specific persistence details inside the
   * infrastructure layer.
   *
   * Domain Entity → ORM Entity → Database
   *
   * Whenever a new property is added to the User domain entity,
   * it should also be mapped here and in toDomain().
   */
  private toOrm(user: User): UserOrmEntity {
    const row = new UserOrmEntity();
    row.id = user.id;
    row.email = user.email;
    row.hashedPassword = user.hashedPassword;
    row.role = user.role;
    row.emailVerified = user.emailVerified;
    row.googleId = user.googleId;
    row.firstName = user.firstName;
    row.lastName = user.lastName;
    row.userName = user.userName;
    row.dateOfBirth = user.dateOfBirth;
    row.createdAt = user.createdAt;
    row.updatedAt = user.updatedAt;
    row.avatar = user.avatar;
    row.bio = user.bio;
    return row;
  }
}
