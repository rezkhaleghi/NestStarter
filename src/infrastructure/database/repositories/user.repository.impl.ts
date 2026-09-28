import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "@domain/entities/user.entity";
import {
  GoogleAccountConflictException,
  UserAlreadyExistsException,
  UsernameAlreadyExistsException,
} from "@domain/exceptions/domain.exception";
import { UserRole } from "@domain/enums/user-role.enum";
import { UserSearchResult } from "@domain/repositories/user-search-result";
import { UserRepository } from "@domain/repositories/user.repository";
import { AdminUserSearchFilters } from "@domain/repositories/admin-user-search-filters";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { UserOrmEntity } from "../orm-entities/user.orm-entity";
import {
  getPostgresUniqueViolationColumns,
  isPostgresUniqueViolation,
} from "../utils/postgres-error.util";

/**
 * Concrete implementation of the domain's UserRepository contract.
 *
 * This is the ONLY place that translates between the domain entity
 * and the ORM entity — that translation logic never leaks into
 * domain or application.
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

  async findByIdForUpdate(id: string): Promise<User | null> {
    const row = await this.repo.findOne({
      where: { id },
      lock: {
        mode: "pessimistic_write",
      },
    });

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
      order: {
        [params.sortBy ?? "createdAt"]: params.sortDirection ?? "DESC",
      },
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

  async countByRole(role: UserRole): Promise<number> {
    return this.repo.count({ where: { role: role as UserRole } });
  }

  async save(user: User): Promise<User> {
    try {
      const row = this.toOrm(user);
      const saved = await this.repo.save(row);

      return this.toDomain(saved);
    } catch (error) {
      this.throwUserUniqueViolation(error);
      throw error;
    }
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

      try {
        const saved = await manager.save(UserOrmEntity, this.toOrm(user));

        return this.toDomain(saved);
      } catch (error) {
        this.throwUserUniqueViolation(error);
        throw error;
      }
    });
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      const admins = await manager.find(UserOrmEntity, {
        where: { role: UserRole.ADMIN },
        lock: { mode: "pessimistic_write" },
      });

      const user = await manager.findOne(UserOrmEntity, {
        where: { id },
      });

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
      OR TO_CHAR(user.dateOfBirth, 'YYYY') = :birthYear
      OR TO_CHAR(user.dateOfBirth, 'MM-DD') = :birthMonthDay
      OR TO_CHAR(user.dateOfBirth, 'YYYY-MM') = :birthYearMonth
      OR TO_CHAR(user.dateOfBirth, 'YYYY-MM-DD') = :birthDate
      `,
      {
        exactEmail: normalizedQuery,
        prefix: `${normalizedQuery}%`,
        birthYear: normalizedQuery,
        birthMonthDay: normalizedQuery,
        birthYearMonth: normalizedQuery,
        birthDate: normalizedQuery,
      },
    );

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
        WHEN TO_CHAR(user.dateOfBirth, 'YYYY-MM-DD') = :birthDate THEN 9
        WHEN TO_CHAR(user.dateOfBirth, 'YYYY-MM') = :birthYearMonth THEN 10
        WHEN TO_CHAR(user.dateOfBirth, 'MM-DD') = :birthMonthDay THEN 11
        WHEN TO_CHAR(user.dateOfBirth, 'YYYY') = :birthYear THEN 12
        ELSE 13
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
      birthYear: normalizedQuery,
      birthMonthDay: normalizedQuery,
      birthYearMonth: normalizedQuery,
      birthDate: normalizedQuery,
    });

    qb.orderBy("search_rank", "ASC");
    qb.addOrderBy("user.createdAt", "DESC");
    qb.addOrderBy("user.id", "ASC");

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

    if (filters.status) {
      qb.andWhere("user.status = :status", {
        status: filters.status,
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
   * Converts a persistence unique-key race into the domain exception that
   * represents the conflicting user field.
   *
   * The pre-checks in the application layer remain useful for fast,
   * user-friendly failures, but they cannot prevent two concurrent requests
   * from passing the check. The database constraint is the final authority.
   */
  private throwUserUniqueViolation(error: unknown): void {
    if (!isPostgresUniqueViolation(error)) {
      return;
    }

    const columns = getPostgresUniqueViolationColumns(error);

    if (columns.length === 1 && columns[0] === "email") {
      throw new UserAlreadyExistsException("the requested email");
    }

    if (columns.length === 1 && columns[0] === "userName") {
      throw new UsernameAlreadyExistsException("the requested username");
    }

    if (columns.length === 1 && columns[0] === "googleId") {
      throw new GoogleAccountConflictException();
    }
  }

  private toDomain(row: UserOrmEntity): User {
    return User.restore({
      id: row.id,
      email: row.email,
      hashedPassword: row.hashedPassword,
      role: row.role,
      emailVerified: row.emailVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      googleId: row.googleId,
      firstName: row.firstName,
      lastName: row.lastName,
      userName: row.userName,
      dateOfBirth: row.dateOfBirth,
      avatar: row.avatar,
      bio: row.bio,
      status: row.status,
    });
  }

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
    row.status = user.status;

    return row;
  }
}
