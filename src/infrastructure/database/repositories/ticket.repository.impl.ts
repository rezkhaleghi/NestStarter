import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import {
  TicketRepository,
  TicketSearchFilters,
} from "@domain/repositories/ticket.repository";
import { TicketOrmEntity } from "../orm-entities/ticket.orm-entity";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

@Injectable()
export class TicketRepositoryImpl extends TicketRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly repository: Repository<TicketOrmEntity>,
  ) {
    super();
  }

  async create(ticket: Ticket): Promise<Ticket> {
    const saved = await this.repository.save(this.toOrm(ticket));
    return this.toDomain(saved);
  }

  async save(ticket: Ticket): Promise<Ticket> {
    const saved = await this.repository.save(this.toOrm(ticket));
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Ticket | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string): Promise<Ticket | null> {
    const row = await this.repository.findOne({
      where: { id },
      lock: { mode: "pessimistic_write" },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(
    userId: string,
    params: PageQuery<"createdAt" | "priority" | "status">,
    filters?: TicketSearchFilters,
  ): Promise<PageResult<Ticket>> {
    const qb = this.repository.createQueryBuilder("ticket");
    qb.where("ticket.userId = :userId", { userId });

    if (filters?.status)
      qb.andWhere("ticket.status = :status", { status: filters.status });
    if (filters?.priority)
      qb.andWhere("ticket.priority = :priority", {
        priority: filters.priority,
      });
    if (filters?.categoryId)
      qb.andWhere("ticket.categoryId = :categoryId", {
        categoryId: filters.categoryId,
      });
    if (filters?.from)
      qb.andWhere("ticket.createdAt >= :from", { from: filters.from });
    if (filters?.to) qb.andWhere("ticket.createdAt <= :to", { to: filters.to });

    qb.orderBy(
      `ticket.${params.sortBy ?? "createdAt"}`,
      params.sortDirection ?? "DESC",
    );
    qb.addOrderBy("ticket.id", "ASC");
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map((row) => this.toDomain(row)),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async searchAdminTickets(
    filters: TicketSearchFilters,
    params: PageQuery<"createdAt" | "priority" | "status">,
  ): Promise<PageResult<Ticket>> {
    const qb = this.repository.createQueryBuilder("ticket");

    if (filters.userId)
      qb.andWhere("ticket.userId = :userId", { userId: filters.userId });
    if (filters.status)
      qb.andWhere("ticket.status = :status", { status: filters.status });
    if (filters.priority)
      qb.andWhere("ticket.priority = :priority", {
        priority: filters.priority,
      });
    if (filters.categoryId)
      qb.andWhere("ticket.categoryId = :categoryId", {
        categoryId: filters.categoryId,
      });
    if (filters.assignedToUserId)
      qb.andWhere("ticket.assignedToUserId = :assignedToUserId", {
        assignedToUserId: filters.assignedToUserId,
      });
    if (filters.createdAt)
      qb.andWhere("ticket.createdAt = :createdAt", {
        createdAt: filters.createdAt,
      });
    if (filters.from)
      qb.andWhere("ticket.createdAt >= :from", { from: filters.from });
    if (filters.to) qb.andWhere("ticket.createdAt <= :to", { to: filters.to });

    qb.orderBy(
      `ticket.${params.sortBy ?? "createdAt"}`,
      params.sortDirection ?? "DESC",
    );
    qb.addOrderBy("ticket.id", "ASC");
    qb.skip((params.page - 1) * params.limit);
    qb.take(params.limit);

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map((row) => this.toDomain(row)),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  private toDomain(row: TicketOrmEntity): Ticket {
    return Ticket.create({
      id: row.id,
      userId: row.userId,
      categoryId: row.categoryId,
      subject: row.subject,
      status: row.status,
      priority: row.priority,
      assignedToUserId: row.assignedToUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      closedAt: row.closedAt,
    });
  }

  private toOrm(ticket: Ticket): TicketOrmEntity {
    const row = new TicketOrmEntity();
    row.id = ticket.id;
    row.userId = ticket.userId;
    row.categoryId = ticket.categoryId;
    row.subject = ticket.subject;
    row.status = ticket.status;
    row.priority = ticket.priority;
    row.assignedToUserId = ticket.assignedToUserId;
    row.createdAt = ticket.createdAt;
    row.updatedAt = ticket.updatedAt;
    row.closedAt = ticket.closedAt;
    return row;
  }
}
