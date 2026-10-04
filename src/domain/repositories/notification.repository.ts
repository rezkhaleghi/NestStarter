import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { Notification } from "../entities/notification.entity";
import { NotificationChannel } from "../enums/notification-channel.enum";
import { NotificationStatus } from "../enums/notification-status.enum";
import { NotificationType } from "../enums/notification-type.enum";

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  from?: Date;
  to?: Date;
}

export abstract class NotificationRepository {
  abstract create(notification: Notification): Promise<Notification>;

  abstract save(notification: Notification): Promise<Notification>;

  abstract findById(id: string): Promise<Notification | null>;

  abstract findByUserIdAndId(
    userId: string,
    id: string,
  ): Promise<Notification | null>;

  abstract findByUserId(
    userId: string,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<Notification>>;

  abstract findPage(
    filters: NotificationFilters,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<Notification>>;
}
