import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserBalance } from "@domain/entities/user-balance.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { UserBalanceAlreadyExistsException } from "@domain/exceptions/domain.exception";
import {
  UserBalanceRepository,
  UserBalanceSortBy,
} from "@domain/repositories/user-balance.repository";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { UserBalanceOrmEntity } from "../orm-entities/user-balance.orm-entity";
import {
  getPostgresUniqueViolationColumns,
  isPostgresUniqueViolation,
} from "../utils/postgres-error.util";

@Injectable()
export class UserBalanceRepositoryImpl implements UserBalanceRepository {
  constructor(
    @InjectRepository(UserBalanceOrmEntity)
    private readonly repository: Repository<UserBalanceOrmEntity>,
  ) {}

  async create(balance: UserBalance): Promise<UserBalance> {
    try {
      const row = this.toOrm(balance);
      const saved = await this.repository.save(row);

      return this.toDomain(saved);
    } catch (error) {
      /**
       * `(userId, currency)` is the database invariant that guarantees
       * one materialized balance per user/currency.
       *
       * The application may check first, but concurrent requests can both
       * pass that check. PostgreSQL must therefore remain the final guard.
       */
      if (
        isPostgresUniqueViolation(error) &&
        this.isUserCurrencyUniqueViolation(error)
      ) {
        throw new UserBalanceAlreadyExistsException(balance.currency);
      }

      throw error;
    }
  }

  async findByUserIdAndCurrency(
    userId: string,
    currency: PaymentCurrency,
  ): Promise<UserBalance | null> {
    const row = await this.repository.findOne({
      where: {
        userId,
        currency,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserIdAndCurrencyForUpdate(
    userId: string,
    currency: PaymentCurrency,
  ): Promise<UserBalance | null> {
    const row = await this.repository.findOne({
      where: {
        userId,
        currency,
      },
      lock: {
        mode: "pessimistic_write",
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(
    userId: string,
    query: PageQuery<UserBalanceSortBy>,
  ): Promise<PageResult<UserBalance>> {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ?? "createdAt";
    const sortDirection = query.sortDirection ?? "DESC";

    const order: Record<UserBalanceSortBy, "ASC" | "DESC"> = {
      currency: "ASC",
      amount: "DESC",
      createdAt: "DESC",
    };

    order[sortBy] = sortDirection;

    const [rows, total] = await this.repository.findAndCount({
      where: {
        userId,
      },
      skip,
      take: limit,
      order,
    });

    return {
      data: rows.map((row) => this.toDomain(row)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(balance: UserBalance): Promise<UserBalance> {
    const row = this.toOrm(balance);
    const saved = await this.repository.save(row);

    return this.toDomain(saved);
  }

  private isUserCurrencyUniqueViolation(error: unknown): boolean {
    const columns = getPostgresUniqueViolationColumns(error);

    return (
      columns.length === 2 &&
      columns.includes("userId") &&
      columns.includes("currency")
    );
  }

  private toDomain(row: UserBalanceOrmEntity): UserBalance {
    return UserBalance.create({
      id: row.id,
      userId: row.userId,
      currency: row.currency,
      amount: row.amount,
    });
  }

  private toOrm(balance: UserBalance): UserBalanceOrmEntity {
    const row = new UserBalanceOrmEntity();

    row.id = balance.id;
    row.userId = balance.userId;
    row.currency = balance.currency;
    row.amount = balance.amount;

    return row;
  }
}
