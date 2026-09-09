import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Deposit } from "@domain/entities/deposit.entity";
import {
  DepositRepository,
  DepositSearchFilters,
} from "@domain/repositories/deposit.repository";
import { DepositOrmEntity } from "../orm-entities/deposit.orm-entity";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

@Injectable()
export class DepositRepositoryImpl extends DepositRepository {
  constructor(
    @InjectRepository(DepositOrmEntity)
    private readonly repository: Repository<DepositOrmEntity>,
  ) {
    super();
  }

  async create(deposit: Deposit): Promise<Deposit> {
    const saved = await this.repository.save(this.toOrm(deposit));
    return this.toDomain(saved);
  }

  async save(deposit: Deposit): Promise<Deposit> {
    const saved = await this.repository.save(this.toOrm(deposit));
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Deposit | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string): Promise<Deposit | null> {
    const row = await this.repository.findOne({
      where: { id },
      lock: { mode: "pessimistic_write" },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByReferenceId(referenceId: string): Promise<Deposit | null> {
    const row = await this.repository.findOne({ where: { referenceId } });
    return row ? this.toDomain(row) : null;
  }

  async search(
    filters: DepositSearchFilters,
    params: PageQuery<"createdAt" | "amount">,
  ): Promise<PageResult<Deposit>> {
    const qb = this.repository.createQueryBuilder("deposit");

    if (filters.userId)
      qb.andWhere("deposit.userId = :userId", { userId: filters.userId });
    if (filters.currency)
      qb.andWhere("deposit.currency = :currency", {
        currency: filters.currency,
      });
    if (filters.status)
      qb.andWhere("deposit.status = :status", { status: filters.status });
    if (filters.referenceId)
      qb.andWhere("deposit.referenceId = :referenceId", {
        referenceId: filters.referenceId,
      });
    if (filters.providerPaymentId)
      qb.andWhere("deposit.providerPaymentId = :providerPaymentId", {
        providerPaymentId: filters.providerPaymentId,
      });
    if (filters.from)
      qb.andWhere("deposit.createdAt >= :from", { from: filters.from });
    if (filters.to) qb.andWhere("deposit.createdAt <= :to", { to: filters.to });

    qb.orderBy("deposit.createdAt", params.sortDirection ?? "DESC");
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

  private toDomain(row: DepositOrmEntity): Deposit {
    return Deposit.create({
      id: row.id,
      userId: row.userId,
      currency: row.currency,
      amount: row.amount,
      status: row.status,
      referenceId: row.referenceId,
      providerPaymentId: row.providerPaymentId,
      transactionId: row.transactionId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      completedAt: row.completedAt,
    });
  }

  private toOrm(deposit: Deposit): DepositOrmEntity {
    const row = new DepositOrmEntity();
    row.id = deposit.id;
    row.userId = deposit.userId;
    row.currency = deposit.currency;
    row.amount = deposit.amount;
    row.status = deposit.status;
    row.referenceId = deposit.referenceId;
    row.providerPaymentId = deposit.providerPaymentId;
    row.transactionId = deposit.transactionId;
    row.createdAt = deposit.createdAt;
    row.updatedAt = deposit.updatedAt;
    row.completedAt = deposit.completedAt;
    return row;
  }
}
