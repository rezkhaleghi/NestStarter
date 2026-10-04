import { Injectable } from "@nestjs/common";

import { Notification } from "@domain/entities/notification.entity";
import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";

import { NotificationRepository } from "@domain/repositories/notification.repository";
import { NotificationService } from "@application/interfaces/notification.service.interface";

export interface SendNotificationInput {
  userId: string;
  email?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  referenceId?: string | null;
}

@Injectable()
export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(input: SendNotificationInput): Promise<Notification> {
    const notification = Notification.create({
      userId: input.userId,
      type: input.type,
      channel: input.channel,
      title: input.title,
      message: input.message,
      referenceId: input.referenceId,
    });

    /*
     * An in-app notification is considered sent once it has been persisted.
     * There is no external delivery provider involved.
     */
    if (input.channel === NotificationChannel.IN_APP) {
      notification.markSent();

      return this.notificationRepository.create(notification);
    }

    /*
     * Email/SMS/Telegram are external channels.
     *
     * We persist PENDING first so that a failed external operation is still
     * represented in the database and can be inspected/retried later.
     */
    const saved = await this.notificationRepository.create(notification);

    try {
      switch (input.channel) {
        case NotificationChannel.EMAIL:
          if (!input.email) {
            throw new Error(
              "Email address is required for email notifications.",
            );
          }

          await this.notificationService.sendEmail(
            input.email,
            input.title,
            input.message,
          );
          break;

        case NotificationChannel.SMS:
          throw new Error("SMS notification provider is not configured.");

        case NotificationChannel.TELEGRAM:
          throw new Error("Telegram notification provider is not configured.");

        default:
          throw new Error(`Unsupported notification channel: ${input.channel}`);
      }

      saved.markSent();

      return await this.notificationRepository.save(saved);
    } catch (error) {
      saved.markFailed(
        error instanceof Error
          ? error.message
          : "Notification delivery failed.",
      );

      await this.notificationRepository.save(saved);

      // The notification itself records the failure. The caller should not
      // have its business transaction fail merely because an external
      // notification provider is unavailable.
      return saved;
    }
  }
}
