import { MarkNotificationReadUseCase } from "./mark-notification-read.use-case";

import { Notification } from "@domain/entities/notification.entity";
import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";
import { NotificationRepository } from "@domain/repositories/notification.repository";
import { NotificationNotFoundException } from "@domain/exceptions/domain.exception";

describe("MarkNotificationReadUseCase", () => {
  const notificationRepositoryMock = {
    findByUserIdAndId: jest.fn(),
    save: jest.fn(),
  };

  const notificationRepository =
    notificationRepositoryMock as unknown as NotificationRepository;

  let useCase: MarkNotificationReadUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationRepositoryMock.save.mockImplementation(
      async (notification: Notification) => notification,
    );

    useCase = new MarkNotificationReadUseCase(notificationRepository);
  });

  it("marks an in-app notification as read", async () => {
    const notification = Notification.create({
      userId: "user-1",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.IN_APP,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
    });

    notification.markSent();

    notificationRepositoryMock.findByUserIdAndId.mockResolvedValue(
      notification,
    );

    const result = await useCase.execute("user-1", notification.id);

    expect(result.getReadAt()).toBeInstanceOf(Date);
    expect(notificationRepositoryMock.save).toHaveBeenCalledWith(notification);
  });

  it("throws when the notification does not belong to the user", async () => {
    notificationRepositoryMock.findByUserIdAndId.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "notification-1")).rejects.toThrow(
      NotificationNotFoundException,
    );

    expect(notificationRepositoryMock.save).not.toHaveBeenCalled();
  });
});
