import { Injectable } from "@nestjs/common";

import { NotificationNotFoundException } from "@domain/exceptions/domain.exception";
import { NotificationRepository } from "@domain/repositories/notification.repository";

@Injectable()
export class AdminGetNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(notificationId: string) {
    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw new NotificationNotFoundException();
    }

    return notification;
  }
}
