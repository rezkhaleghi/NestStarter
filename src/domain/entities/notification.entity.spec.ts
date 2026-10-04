import { Notification } from "./notification.entity";
import { NotificationChannel } from "../enums/notification-channel.enum";
import { NotificationStatus } from "../enums/notification-status.enum";
import { NotificationType } from "../enums/notification-type.enum";

describe("Notification", () => {
  const createNotification = (
    channel: NotificationChannel = NotificationChannel.IN_APP,
  ) =>
    Notification.create({
      userId: "user-1",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
      referenceId: "withdrawal-1",
    });

  it("creates a pending notification", () => {
    const notification = createNotification(NotificationChannel.EMAIL);

    expect(notification.id).toBeDefined();
    expect(notification.userId).toBe("user-1");
    expect(notification.type).toBe(NotificationType.WITHDRAWAL_APPROVED);
    expect(notification.channel).toBe(NotificationChannel.EMAIL);
    expect(notification.getStatus()).toBe(NotificationStatus.PENDING);
    expect(notification.getSentAt()).toBeNull();
    expect(notification.getReadAt()).toBeNull();
    expect(notification.getFailureReason()).toBeNull();
  });

  it("generates a notification id", () => {
    const notification = createNotification();

    expect(notification.id).toBeDefined();
    expect(typeof notification.id).toBe("string");
  });

  it("marks a notification as sent", () => {
    const notification = createNotification(NotificationChannel.EMAIL);

    notification.markSent();

    expect(notification.getStatus()).toBe(NotificationStatus.SENT);
    expect(notification.getSentAt()).toBeInstanceOf(Date);
    expect(notification.getFailureReason()).toBeNull();
  });

  it("marks a notification as failed", () => {
    const notification = createNotification(NotificationChannel.EMAIL);

    notification.markFailed("SMTP unavailable");

    expect(notification.getStatus()).toBe(NotificationStatus.FAILED);
    expect(notification.getSentAt()).toBeNull();
    expect(notification.getFailureReason()).toBe("SMTP unavailable");
  });

  it("clears a previous failure when marked as sent", () => {
    const notification = createNotification(NotificationChannel.EMAIL);

    notification.markFailed("SMTP unavailable");
    notification.markSent();

    expect(notification.getStatus()).toBe(NotificationStatus.SENT);
    expect(notification.getFailureReason()).toBeNull();
    expect(notification.getSentAt()).toBeInstanceOf(Date);
  });

  it("marks an in-app notification as read", () => {
    const notification = createNotification(NotificationChannel.IN_APP);

    notification.markSent();
    notification.markRead();

    expect(notification.getReadAt()).toBeInstanceOf(Date);
  });

  it("rejects marking an email notification as read", () => {
    const notification = createNotification(NotificationChannel.EMAIL);

    notification.markSent();

    expect(() => notification.markRead()).toThrow(
      "Only in-app notifications can be marked as read.",
    );
  });

  it("rejects marking an unsent in-app notification as read", () => {
    const notification = createNotification(NotificationChannel.IN_APP);

    expect(() => notification.markRead()).toThrow(
      "Only sent in-app notifications can be marked as read.",
    );
  });

  it("restores a notification without changing persisted state", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const sentAt = new Date("2026-01-01T00:01:00.000Z");
    const readAt = new Date("2026-01-01T00:02:00.000Z");

    const notification = Notification.restore({
      id: "notification-1",
      userId: "user-1",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.IN_APP,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
      referenceId: "withdrawal-1",
      status: NotificationStatus.SENT,
      sentAt,
      readAt,
      failureReason: null,
      createdAt,
    });

    expect(notification.id).toBe("notification-1");
    expect(notification.getStatus()).toBe(NotificationStatus.SENT);
    expect(notification.getSentAt()).toBe(sentAt);
    expect(notification.getReadAt()).toBe(readAt);
    expect(notification.createdAt).toBe(createdAt);
  });
});
