import { SendNotificationUseCase } from "./send-notification.use-case";

import { Notification } from "@domain/entities/notification.entity";
import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationStatus } from "@domain/enums/notification-status.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";
import { NotificationRepository } from "@domain/repositories/notification.repository";
import { NotificationService } from "@application/interfaces/notification.service.interface";

describe("SendNotificationUseCase", () => {
  const notificationRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const notificationRepository =
    notificationRepositoryMock as unknown as NotificationRepository;

  const notificationServiceMock = {
    sendEmail: jest.fn(),
  };

  const notificationService =
    notificationServiceMock as unknown as NotificationService;

  let useCase: SendNotificationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationRepositoryMock.create.mockImplementation(
      async (notification: Notification) => notification,
    );

    notificationRepositoryMock.save.mockImplementation(
      async (notification: Notification) => notification,
    );

    notificationServiceMock.sendEmail.mockResolvedValue(undefined);

    useCase = new SendNotificationUseCase(
      notificationRepository,
      notificationService,
    );
  });

  it("creates an in-app notification as sent", async () => {
    const result = await useCase.execute({
      userId: "user-1",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.IN_APP,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
      referenceId: "withdrawal-1",
    });

    expect(result.getStatus()).toBe(NotificationStatus.SENT);
    expect(result.getSentAt()).toBeInstanceOf(Date);

    expect(notificationRepositoryMock.create).toHaveBeenCalledTimes(1);
    expect(notificationRepositoryMock.save).not.toHaveBeenCalled();
    expect(notificationServiceMock.sendEmail).not.toHaveBeenCalled();
  });

  it("creates an email notification and marks it as sent after successful delivery", async () => {
    const result = await useCase.execute({
      userId: "user-1",
      email: "user@example.com",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.EMAIL,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
      referenceId: "withdrawal-1",
    });

    expect(notificationRepositoryMock.create).toHaveBeenCalledTimes(1);

    expect(notificationServiceMock.sendEmail).toHaveBeenCalledWith(
      "user@example.com",
      "Withdrawal approved",
      "Your withdrawal was approved.",
    );

    expect(notificationRepositoryMock.save).toHaveBeenCalledTimes(1);

    expect(result.getStatus()).toBe(NotificationStatus.SENT);
    expect(result.getSentAt()).toBeInstanceOf(Date);
  });

  it("records an email failure instead of throwing", async () => {
    notificationServiceMock.sendEmail.mockRejectedValue(
      new Error("SMTP unavailable"),
    );

    const result = await useCase.execute({
      userId: "user-1",
      email: "user@example.com",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.EMAIL,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
      referenceId: "withdrawal-1",
    });

    expect(result.getStatus()).toBe(NotificationStatus.FAILED);
    expect(result.getFailureReason()).toBe("SMTP unavailable");
    expect(result.getSentAt()).toBeNull();

    expect(notificationRepositoryMock.create).toHaveBeenCalledTimes(1);
    expect(notificationRepositoryMock.save).toHaveBeenCalledTimes(1);
  });

  it("records failure when an email address is missing", async () => {
    const result = await useCase.execute({
      userId: "user-1",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.EMAIL,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
    });

    expect(result.getStatus()).toBe(NotificationStatus.FAILED);
    expect(result.getFailureReason()).toBe(
      "Email address is required for email notifications.",
    );

    expect(notificationServiceMock.sendEmail).not.toHaveBeenCalled();
    expect(notificationRepositoryMock.save).toHaveBeenCalledTimes(1);
  });

  it("records failure for an unconfigured SMS provider", async () => {
    const result = await useCase.execute({
      userId: "user-1",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.SMS,
      title: "Withdrawal approved",
      message: "Your withdrawal was approved.",
    });

    expect(result.getStatus()).toBe(NotificationStatus.FAILED);
    expect(result.getFailureReason()).toBe(
      "SMS notification provider is not configured.",
    );

    expect(notificationRepositoryMock.create).toHaveBeenCalledTimes(1);
    expect(notificationRepositoryMock.save).toHaveBeenCalledTimes(1);
  });
});
