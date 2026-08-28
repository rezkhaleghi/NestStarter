import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";

import { AuditLog } from "../../../domain/entities/audit-log.entity";
import {
  AuditLogFilters,
  AuditLogRepository,
} from "../../../domain/repositories/audit-log.repository";
import { AuditAction } from "../../../domain/enums/audit-action.enum";
import {
  PageQuery,
  PageResult,
} from "../../../application/dtos/page-query.input";
import { AuditLogOrmEntity } from "../orm-entities/audit-log.orm-entity";

@Injectable()
export class AuditLogRepositoryImpl implements AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  async create(log: AuditLog): Promise<AuditLog> {
    const row = this.toOrm(log);
    const saved = await this.repo.save(row);

    return this.toDomain(saved);
  }

  async findPage(
    filters: AuditLogFilters,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<AuditLog>> {
    const qb = this.repo.createQueryBuilder("audit");

    if (filters.action) {
      qb.andWhere("audit.action = :action", {
        action: filters.action,
      });
    }

    if (filters.actorUserId) {
      qb.andWhere("audit.actorUserId = :actorUserId", {
        actorUserId: filters.actorUserId,
      });
    }

    if (filters.targetUserId) {
      qb.andWhere("audit.targetUserId = :targetUserId", {
        targetUserId: filters.targetUserId,
      });
    }

    if (filters.from) {
      qb.andWhere("audit.createdAt >= :from", {
        from: filters.from,
      });
    }

    if (filters.to) {
      qb.andWhere("audit.createdAt <= :to", {
        to: filters.to,
      });
    }

    qb.orderBy("audit.createdAt", params.sortDirection ?? "DESC");

    qb.addOrderBy("audit.id", "ASC");

    const [rows, total] = await qb
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();

    return {
      data: rows.map((row) => this.toDomain(row)),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  private toDomain(row: AuditLogOrmEntity): AuditLog {
    return new AuditLog(
      row.id,
      row.actorUserId,
      row.action,
      row.targetUserId,
      row.metadata,
      row.createdAt,
    );
  }

  private toOrm(log: AuditLog): AuditLogOrmEntity {
    const row = new AuditLogOrmEntity();

    row.id = log.id || randomUUID();
    row.actorUserId = log.actorUserId;
    row.action = log.action;
    row.targetUserId = log.targetUserId;
    row.metadata = log.metadata;
    row.createdAt = log.createdAt;

    return row;
  }
}
