import { randomUUID } from "crypto";

import { NotificationChannel } from "../enums/notification-channel.enum";
import { NotificationStatus } from "../enums/notification-status.enum";
import { NotificationType } from "../enums/notification-type.enum";
import { DomainException } from "../exceptions/domain.exception";

export interface CreateNotificationProps {
  id?: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  referenceId?: string | null;
  status?: NotificationStatus;
  sentAt?: Date | null;
  readAt?: Date | null;
  failureReason?: string | null;
}

export interface RestoreNotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  referenceId: string | null;
  status: NotificationStatus;
  sentAt: Date | null;
  readAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
}

export class Notification {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly channel: NotificationChannel,
    public readonly title: string,
    public readonly message: string,
    public readonly referenceId: string | null,
    private status: NotificationStatus,
    private sentAt: Date | null,
    private readAt: Date | null,
    private failureReason: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateNotificationProps): Notification {
    if (!props.userId.trim()) {
      throw new DomainException("Notification userId must not be empty.");
    }

    if (!props.title.trim()) {
      throw new DomainException("Notification title must not be empty.");
    }

    if (!props.message.trim()) {
      throw new DomainException("Notification message must not be empty.");
    }

    return new Notification(
      props.id ?? randomUUID(),
      props.userId,
      props.type,
      props.channel,
      props.title,
      props.message,
      props.referenceId ?? null,
      props.status ?? NotificationStatus.PENDING,
      props.sentAt ?? null,
      props.readAt ?? null,
      props.failureReason ?? null,
      new Date(),
    );
  }

  static restore(props: RestoreNotificationProps): Notification {
    return new Notification(
      props.id,
      props.userId,
      props.type,
      props.channel,
      props.title,
      props.message,
      props.referenceId,
      props.status,
      props.sentAt,
      props.readAt,
      props.failureReason,
      props.createdAt,
    );
  }

  getStatus(): NotificationStatus {
    return this.status;
  }

  getSentAt(): Date | null {
    return this.sentAt;
  }

  getReadAt(): Date | null {
    return this.readAt;
  }

  getFailureReason(): string | null {
    return this.failureReason;
  }

  markSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.failureReason = null;
  }

  markFailed(reason: string): void {
    this.status = NotificationStatus.FAILED;
    this.sentAt = null;
    this.failureReason = reason;
  }

  markRead(): void {
    if (this.channel !== NotificationChannel.IN_APP) {
      throw new DomainException(
        "Only in-app notifications can be marked as read.",
      );
    }

    if (this.status !== NotificationStatus.SENT) {
      throw new DomainException(
        "Only sent in-app notifications can be marked as read.",
      );
    }

    this.readAt = new Date();
  }
}
