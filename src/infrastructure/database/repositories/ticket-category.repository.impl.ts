import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { TicketCategoryOrmEntity } from "../orm-entities/ticket-category.orm-entity";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

@Injectable()
export class TicketCategoryRepositoryImpl extends TicketCategoryRepository {
  constructor(
    @InjectRepository(TicketCategoryOrmEntity)
    private readonly repository: Repository<TicketCategoryOrmEntity>,
  ) {
    super();
  }

  async create(category: TicketCategory): Promise<TicketCategory> {
    const saved = await this.repository.save(this.toOrm(category));
    return this.toDomain(saved);
  }

  async save(category: TicketCategory): Promise<TicketCategory> {
    const saved = await this.repository.save(this.toOrm(category));
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<TicketCategory | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findPage(
    params: PageQuery<"createdAt" | "name">,
  ): Promise<PageResult<TicketCategory>> {
    const [rows, total] = await this.repository.findAndCount({
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

  async findAll(): Promise<TicketCategory[]> {
    const rows = await this.repository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toDomain(row: TicketCategoryOrmEntity): TicketCategory {
    return TicketCategory.create({
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toOrm(category: TicketCategory): TicketCategoryOrmEntity {
    const row = new TicketCategoryOrmEntity();
    row.id = category.id;
    row.name = category.name;
    row.description = category.description;
    row.isActive = category.isActive;
    row.createdAt = category.createdAt;
    row.updatedAt = category.updatedAt;
    return row;
  }
}
