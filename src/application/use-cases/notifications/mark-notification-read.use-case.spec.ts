import { MarkNotificationReadUseCase } from "./mark-notification-read.use-case";

import { Notification } from "@domain/entities/notification.entity";
import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";
import { NotificationNotFoundException } from "@domain/exceptions/domain.exception";

describe("MarkNotificationReadUseCase", () => {
  const notificationRepository = {
    findByUserIdAndId: jest.fn(),
    save: jest.fn(),
  };

  let useCase: MarkNotificationReadUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationRepository.save.mockImplementation(
      async (notification) => notification,
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

    notificationRepository.findByUserIdAndId.mockResolvedValue(notification);

    const result = await useCase.execute("user-1", notification.id);

    expect(result.getReadAt()).toBeInstanceOf(Date);
    expect(notificationRepository.save).toHaveBeenCalledWith(notification);
  });

  it("throws when the notification does not belong to the user", async () => {
    notificationRepository.findByUserIdAndId.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "notification-1")).rejects.toThrow(
      NotificationNotFoundException,
    );

    expect(notificationRepository.save).not.toHaveBeenCalled();
  });
});
