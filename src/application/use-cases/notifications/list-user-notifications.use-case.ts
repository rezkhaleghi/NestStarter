import { Injectable } from "@nestjs/common";

import { NotificationRepository } from "@domain/repositories/notification.repository";

import { PageQuery } from "@shared/pagination/page-query";

export interface ListUserNotificationsInput {
  userId: string;
  page: number;
  limit: number;
  sortDirection?: "ASC" | "DESC";
}

@Injectable()
export class ListUserNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(input: ListUserNotificationsInput) {
    const pageQuery: PageQuery<"createdAt"> = {
      page: input.page,
      limit: input.limit,
      sortBy: "createdAt",
      sortDirection: input.sortDirection ?? "DESC",
    };

    return this.notificationRepository.findByUserId(input.userId, pageQuery);
  }
}
