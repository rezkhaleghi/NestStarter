import { Injectable } from "@nestjs/common";

import { NotificationNotFoundException } from "@domain/exceptions/domain.exception";
import { NotificationRepository } from "@domain/repositories/notification.repository";

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findByUserIdAndId(
      userId,
      notificationId,
    );

    if (!notification) {
      throw new NotificationNotFoundException();
    }

    notification.markRead();

    return this.notificationRepository.save(notification);
  }
}
