import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Notification } from "@domain/entities/notification.entity";
import {
  NotificationFilters,
  NotificationRepository,
} from "@domain/repositories/notification.repository";

import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { NotificationOrmEntity } from "../orm-entities/notification.orm-entity";

@Injectable()
export class NotificationRepositoryImpl extends NotificationRepository {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly repository: Repository<NotificationOrmEntity>,
  ) {
    super();
  }

  async create(notification: Notification): Promise<Notification> {
    const saved = await this.repository.save(this.toOrm(notification));

    return this.toDomain(saved);
  }

  async save(notification: Notification): Promise<Notification> {
    const saved = await this.repository.save(this.toOrm(notification));

    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Notification | null> {
    const row = await this.repository.findOne({
      where: { id },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserIdAndId(
    userId: string,
    id: string,
  ): Promise<Notification | null> {
    const row = await this.repository.findOne({
      where: {
        id,
        userId,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(
    userId: string,
    params: PageQuery<"createdAt">,
    filters?: Pick<NotificationFilters, "type" | "channel">,
  ): Promise<PageResult<Notification>> {
    return this.findPage(
      {
        userId,
        type: filters?.type,
        channel: filters?.channel,
      },
      params,
    );
  }

  async findPage(
    filters: NotificationFilters,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<Notification>> {
    const qb = this.repository.createQueryBuilder("notification");

    if (filters.userId) {
      qb.andWhere("notification.userId = :userId", {
        userId: filters.userId,
      });
    }

    if (filters.type) {
      qb.andWhere("notification.type = :type", {
        type: filters.type,
      });
    }

    if (filters.channel) {
      qb.andWhere("notification.channel = :channel", {
        channel: filters.channel,
      });
    }

    if (filters.status) {
      qb.andWhere("notification.status = :status", {
        status: filters.status,
      });
    }

    if (filters.from) {
      qb.andWhere("notification.createdAt >= :from", {
        from: filters.from,
      });
    }

    if (filters.to) {
      qb.andWhere("notification.createdAt <= :to", {
        to: filters.to,
      });
    }

    qb.orderBy("notification.createdAt", params.sortDirection ?? "DESC");

    // createdAt is not guaranteed to be unique. The UUID provides
    // deterministic ordering when multiple notifications have the same
    // timestamp.
    qb.addOrderBy("notification.id", "ASC");

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

  private toDomain(row: NotificationOrmEntity): Notification {
    return Notification.restore({
      id: row.id,
      userId: row.userId,
      type: row.type,
      channel: row.channel,
      status: row.status,
      title: row.title,
      message: row.message,
      referenceId: row.referenceId,
      sentAt: row.sentAt,
      readAt: row.readAt,
      failureReason: row.failureReason,
      createdAt: row.createdAt,
    });
  }

  private toOrm(notification: Notification): NotificationOrmEntity {
    const row = new NotificationOrmEntity();

    row.id = notification.id;
    row.userId = notification.userId;
    row.type = notification.type;
    row.channel = notification.channel;
    row.status = notification.getStatus();
    row.title = notification.title;
    row.message = notification.message;
    row.referenceId = notification.referenceId;
    row.sentAt = notification.getSentAt();
    row.readAt = notification.getReadAt();
    row.failureReason = notification.getFailureReason();
    row.createdAt = notification.createdAt;

    return row;
  }
}
