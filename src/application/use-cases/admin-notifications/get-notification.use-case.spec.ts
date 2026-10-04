import { AdminGetNotificationUseCase } from "./get-notification.use-case";

import { Notification } from "@domain/entities/notification.entity";
import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";
import { NotificationNotFoundException } from "@domain/exceptions/domain.exception";

describe("AdminGetNotificationUseCase", () => {
  const notificationRepository = {
    findById: jest.fn(),
  };

  let useCase: AdminGetNotificationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new AdminGetNotificationUseCase(notificationRepository);
  });

  it("returns a notification by id", async () => {
    const notification = Notification.create({
      userId: "user-1",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.EMAIL,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
    });

    notificationRepository.findById.mockResolvedValue(notification);

    const result = await useCase.execute(notification.id);

    expect(result).toBe(notification);
    expect(notificationRepository.findById).toHaveBeenCalledWith(
      notification.id,
    );
  });

  it("throws when the notification does not exist", async () => {
    notificationRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing-notification")).rejects.toThrow(
      NotificationNotFoundException,
    );
  });
});
