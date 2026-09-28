import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketCategoryAlreadyExistsException } from "@domain/exceptions/domain.exception";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { TicketCategoryOrmEntity } from "../orm-entities/ticket-category.orm-entity";
import {
  getPostgresUniqueViolationColumns,
  isPostgresUniqueViolation,
} from "../utils/postgres-error.util";

@Injectable()
export class TicketCategoryRepositoryImpl extends TicketCategoryRepository {
  constructor(
    @InjectRepository(TicketCategoryOrmEntity)
    private readonly repository: Repository<TicketCategoryOrmEntity>,
  ) {
    super();
  }

  async create(category: TicketCategory): Promise<TicketCategory> {
    try {
      const saved = await this.repository.save(this.toOrm(category));

      return this.toDomain(saved);
    } catch (error) {
      if (
        isPostgresUniqueViolation(error) &&
        this.isNameUniqueViolation(error)
      ) {
        throw new TicketCategoryAlreadyExistsException(category.name);
      }

      throw error;
    }
  }

  async save(category: TicketCategory): Promise<TicketCategory> {
    try {
      const saved = await this.repository.save(this.toOrm(category));

      return this.toDomain(saved);
    } catch (error) {
      if (
        isPostgresUniqueViolation(error) &&
        this.isNameUniqueViolation(error)
      ) {
        throw new TicketCategoryAlreadyExistsException(category.name);
      }

      throw error;
    }
  }

  async findById(id: string): Promise<TicketCategory | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string): Promise<TicketCategory | null> {
    const row = await this.repository.findOne({
      where: { id },
      lock: { mode: "pessimistic_write" },
    });

    return row ? this.toDomain(row) : null;
  }

  async findPage(
    params: PageQuery<"createdAt" | "name">,
  ): Promise<PageResult<TicketCategory>> {
    const [rows, total] = await this.repository.findAndCount({
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

  private isNameUniqueViolation(error: unknown): boolean {
    const columns = getPostgresUniqueViolationColumns(error);

    return columns.length === 1 && columns[0] === "name";
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
