import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import {
  WithdrawalRepository,
  WithdrawalSearchFilters,
} from "@domain/repositories/withdrawal.repository";
import { WithdrawalOrmEntity } from "../orm-entities/withdrawal.orm-entity";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

@Injectable()
export class WithdrawalRepositoryImpl extends WithdrawalRepository {
  constructor(
    @InjectRepository(WithdrawalOrmEntity)
    private readonly repository: Repository<WithdrawalOrmEntity>,
  ) {
    super();
  }

  async create(withdrawal: Withdrawal): Promise<Withdrawal> {
    const saved = await this.repository.save(this.toOrm(withdrawal));
    return this.toDomain(saved);
  }

  async save(withdrawal: Withdrawal): Promise<Withdrawal> {
    const saved = await this.repository.save(this.toOrm(withdrawal));
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Withdrawal | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string): Promise<Withdrawal | null> {
    const row = await this.repository.findOne({
      where: { id },
      lock: { mode: "pessimistic_write" },
    });
    return row ? this.toDomain(row) : null;
  }

  async search(
    filters: WithdrawalSearchFilters,
    params: PageQuery<"createdAt" | "amount">,
  ): Promise<PageResult<Withdrawal>> {
    const qb = this.repository.createQueryBuilder("withdrawal");

    if (filters.userId)
      qb.andWhere("withdrawal.userId = :userId", { userId: filters.userId });
    if (filters.currency)
      qb.andWhere("withdrawal.currency = :currency", {
        currency: filters.currency,
      });
    if (filters.status)
      qb.andWhere("withdrawal.status = :status", { status: filters.status });
    if (filters.referenceId)
      qb.andWhere("withdrawal.referenceId = :referenceId", {
        referenceId: filters.referenceId,
      });
    if (filters.providerWithdrawalId)
      qb.andWhere("withdrawal.providerWithdrawalId = :providerWithdrawalId", {
        providerWithdrawalId: filters.providerWithdrawalId,
      });
    if (filters.from)
      qb.andWhere("withdrawal.createdAt >= :from", { from: filters.from });
    if (filters.to)
      qb.andWhere("withdrawal.createdAt <= :to", { to: filters.to });

    qb.orderBy("withdrawal.createdAt", params.sortDirection ?? "DESC");
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map((row) => this.toDomain(row)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  private toDomain(row: WithdrawalOrmEntity): Withdrawal {
    return Withdrawal.create({
      id: row.id,
      userId: row.userId,
      currency: row.currency,
      amount: row.amount,
      status: row.status,
      destination: row.destination,
      referenceId: row.referenceId,
      providerWithdrawalId: row.providerWithdrawalId,
      transactionId: row.transactionId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      completedAt: row.completedAt,
      rejectionReason: row.rejectionReason,
    });
  }

  private toOrm(withdrawal: Withdrawal): WithdrawalOrmEntity {
    const row = new WithdrawalOrmEntity();
    row.id = withdrawal.id;
    row.userId = withdrawal.userId;
    row.currency = withdrawal.currency;
    row.amount = withdrawal.amount;
    row.status = withdrawal.status;
    row.destination = withdrawal.destination;
    row.referenceId = withdrawal.referenceId;
    row.providerWithdrawalId = withdrawal.providerWithdrawalId;
    row.transactionId = withdrawal.transactionId;
    row.rejectionReason = withdrawal.rejectionReason;
    row.createdAt = withdrawal.createdAt;
    row.updatedAt = withdrawal.updatedAt;
    row.completedAt = withdrawal.completedAt;
    return row;
  }
}
