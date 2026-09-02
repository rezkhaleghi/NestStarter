import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserBalance } from "../../../domain/entities/user-balance.entity";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { UserBalanceRepository } from "../../../domain/repositories/user-balance.repository";
import { UserBalanceOrmEntity } from "../orm-entities/user-balance.orm-entity";

@Injectable()
export class UserBalanceRepositoryImpl implements UserBalanceRepository {
  constructor(
    @InjectRepository(UserBalanceOrmEntity)
    private readonly repository: Repository<UserBalanceOrmEntity>,
  ) {}

  async create(balance: UserBalance): Promise<UserBalance> {
    const row = this.toOrm(balance);

    const saved = await this.repository.save(row);

    return this.toDomain(saved);
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

  async findByUserId(userId: string): Promise<UserBalance[]> {
    const rows = await this.repository.find({
      where: {
        userId,
      },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async save(balance: UserBalance): Promise<UserBalance> {
    const row = this.toOrm(balance);

    const saved = await this.repository.save(row);

    return this.toDomain(saved);
  }

  private toDomain(row: UserBalanceOrmEntity): UserBalance {
    return new UserBalance(
      row.id,
      row.userId,
      row.currency,
      row.amount,
      row.createdAt,
      row.updatedAt,
    );
  }

  private toOrm(balance: UserBalance): UserBalanceOrmEntity {
    const row = new UserBalanceOrmEntity();

    row.id = balance.id;
    row.userId = balance.userId;
    row.currency = balance.currency;
    row.amount = balance.amount;
    row.createdAt = balance.createdAt;
    row.updatedAt = balance.updatedAt;

    return row;
  }
}
