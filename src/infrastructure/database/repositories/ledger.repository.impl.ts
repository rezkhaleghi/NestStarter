import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Ledger } from "../../../domain/entities/ledger.entity";
import { LedgerRepository } from "../../../domain/repositories/ledger.repository";

import { LedgerOrmEntity } from "../orm-entities/ledger.orm-entity";

@Injectable()
export class LedgerRepositoryImpl extends LedgerRepository {
  constructor(
    @InjectRepository(LedgerOrmEntity)
    private readonly repository: Repository<LedgerOrmEntity>,
  ) {
    super();
  }

  async create(ledger: Ledger): Promise<Ledger> {
    const row = this.repository.create({
      id: ledger.id,
      userId: ledger.userId,
      currency: ledger.currency,
      amount: ledger.amount,
      balanceBefore: ledger.balanceBefore,
      balanceAfter: ledger.balanceAfter,
      type: ledger.type,
      actorUserId: ledger.actorUserId,
      referenceId: ledger.referenceId,
      metadata: ledger.metadata,
      createdAt: ledger.createdAt,
    });

    const saved = await this.repository.save(row);

    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Ledger | null> {
    const row = await this.repository.findOne({
      where: { id },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Ledger[]> {
    const rows = await this.repository.find({
      where: { userId },
      order: {
        createdAt: "DESC",
      },
      take: options?.limit,
      skip: options?.offset,
    });

    return rows.map((row) => this.toDomain(row));
  }

  async countByUserId(userId: string): Promise<number> {
    return this.repository.count({
      where: { userId },
    });
  }

  private toDomain(row: LedgerOrmEntity): Ledger {
    return Ledger.restore({
      id: row.id,
      userId: row.userId,
      currency: row.currency,
      amount: row.amount,
      balanceBefore: row.balanceBefore,
      balanceAfter: row.balanceAfter,
      type: row.type,
      actorUserId: row.actorUserId,
      referenceId: row.referenceId,
      metadata: row.metadata,
      createdAt: row.createdAt,
    });
  }
}
