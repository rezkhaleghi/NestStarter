import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Page } from "@domain/entities/page.entity";
import { PageStatus } from "@domain/enums/page-status.enum";
import { PageSlugAlreadyExistsException } from "@domain/exceptions/domain.exception";
import {
  PageFilters,
  PageRepository,
} from "@domain/repositories/page.repository";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { PageOrmEntity } from "../orm-entities/page.orm-entity";
import {
  getPostgresUniqueViolationColumns,
  isPostgresUniqueViolation,
} from "../utils/postgres-error.util";

@Injectable()
export class PageRepositoryImpl extends PageRepository {
  constructor(
    @InjectRepository(PageOrmEntity)
    private readonly repository: Repository<PageOrmEntity>,
  ) {
    super();
  }

  async create(page: Page): Promise<Page> {
    try {
      const saved = await this.repository.save(this.toOrm(page));
      return this.toDomain(saved);
    } catch (error) {
      this.throwIfSlugConflict(error);
      throw error;
    }
  }

  async save(page: Page): Promise<Page> {
    try {
      const saved = await this.repository.save(this.toOrm(page));
      return this.toDomain(saved);
    } catch (error) {
      this.throwIfSlugConflict(error);
      throw error;
    }
  }

  async findById(id: string): Promise<Page | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string): Promise<Page | null> {
    const row = await this.repository.findOne({
      where: { id },
      lock: { mode: "pessimistic_write" },
    });

    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Page | null> {
    const row = await this.repository.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findPublishedBySlug(slug: string): Promise<Page | null> {
    const row = await this.repository.findOne({
      where: {
        slug,
        status: PageStatus.PUBLISHED,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async findPage(
    filters: PageFilters,
    params: PageQuery<"createdAt" | "updatedAt" | "title">,
  ): Promise<PageResult<Page>> {
    const query = this.repository.createQueryBuilder("page");

    if (filters.status) {
      query.andWhere("page.status = :status", {
        status: filters.status,
      });
    }

    const sortBy = params.sortBy ?? "createdAt";
    const sortDirection = params.sortDirection ?? "DESC";

    query
      .orderBy(`page.${sortBy}`, sortDirection)
      .addOrderBy("page.id", "ASC")
      .skip((params.page - 1) * params.limit)
      .take(params.limit);

    const [rows, total] = await query.getManyAndCount();

    return {
      data: rows.map((row) => this.toDomain(row)),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private throwIfSlugConflict(error: unknown): void {
    if (!isPostgresUniqueViolation(error)) {
      return;
    }

    const columns = getPostgresUniqueViolationColumns(error);

    if (columns.length === 1 && columns[0] === "slug") {
      throw new PageSlugAlreadyExistsException();
    }
  }

  private toDomain(row: PageOrmEntity): Page {
    return Page.create({
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toOrm(page: Page): PageOrmEntity {
    const row = new PageOrmEntity();

    row.id = page.id;
    row.title = page.title;
    row.slug = page.slug;
    row.content = page.content;
    row.status = page.status;
    row.createdAt = page.createdAt;
    row.updatedAt = page.updatedAt;

    return row;
  }
}
