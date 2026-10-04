import { Injectable } from "@nestjs/common";

import {
  NotificationFilters,
  NotificationRepository,
} from "@domain/repositories/notification.repository";

import { PageQuery } from "@shared/pagination/page-query";

export interface AdminListNotificationsInput extends NotificationFilters {
  page: number;
  limit: number;
  sortBy?: "createdAt";
  sortDirection?: "ASC" | "DESC";
}

@Injectable()
export class AdminListNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(input: AdminListNotificationsInput) {
    const pageQuery: PageQuery<"createdAt"> = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    };

    return this.notificationRepository.findPage(
      {
        userId: input.userId,
        type: input.type,
        channel: input.channel,
        status: input.status,
        from: input.from,
        to: input.to,
      },
      pageQuery,
    );
  }
}
