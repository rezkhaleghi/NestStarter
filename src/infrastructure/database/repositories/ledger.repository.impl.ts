import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Ledger } from "../../../domain/entities/ledger.entity";
import { LedgerRepository } from "../../../domain/repositories/ledger.repository";

import { LedgerOrmEntity } from "../orm-entities/ledger.orm-entity";
import { AdminLedgerSearchFilters } from "@domain/repositories/admin-ledger-search-filters";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

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

  async searchAdminLedgers(
    filters: AdminLedgerSearchFilters,
    params: PageQuery<"createdAt" | "amount">,
  ): Promise<PageResult<Ledger>> {
    const query = this.repository.createQueryBuilder("ledger");

    if (filters.userId) {
      query.andWhere("ledger.userId = :userId", {
        userId: filters.userId,
      });
    }

    if (filters.currency) {
      query.andWhere("ledger.currency = :currency", {
        currency: filters.currency,
      });
    }

    if (filters.type) {
      query.andWhere("ledger.type = :type", {
        type: filters.type,
      });
    }

    if (filters.actorUserId) {
      query.andWhere("ledger.actorUserId = :actorUserId", {
        actorUserId: filters.actorUserId,
      });
    }

    if (filters.referenceId) {
      query.andWhere("ledger.referenceId = :referenceId", {
        referenceId: filters.referenceId,
      });
    }

    if (filters.from) {
      query.andWhere("ledger.createdAt >= :from", {
        from: filters.from,
      });
    }

    if (filters.to) {
      query.andWhere("ledger.createdAt <= :to", {
        to: filters.to,
      });
    }

    const sortColumn =
      params.sortBy === "amount" ? "ledger.amount" : "ledger.createdAt";

    query.orderBy(sortColumn, params.sortDirection ?? "DESC");

    query.skip((params.page - 1) * params.limit);
    query.take(params.limit);

    const [rows, total] = await query.getManyAndCount();

    return {
      data: rows.map((row) => this.toDomain(row)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
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
