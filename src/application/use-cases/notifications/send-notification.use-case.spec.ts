import { SendNotificationUseCase } from "./send-notification.use-case";

import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationStatus } from "@domain/enums/notification-status.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";
import { NotificationRepository } from "@domain/repositories/notification.repository";

describe("SendNotificationUseCase", () => {
  const notificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as NotificationRepository;

  const notificationService = {
    sendEmail: jest.fn(),
  };

  let useCase: SendNotificationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationRepository.create.mockImplementation(
      async (notification) => notification,
    );

    notificationRepository.save.mockImplementation(
      async (notification) => notification,
    );

    notificationService.sendEmail.mockResolvedValue(undefined);

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

    expect(notificationRepository.create).toHaveBeenCalledTimes(1);
    expect(notificationRepository.save).not.toHaveBeenCalled();
    expect(notificationService.sendEmail).not.toHaveBeenCalled();
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

    expect(notificationRepository.create).toHaveBeenCalledTimes(1);

    expect(notificationService.sendEmail).toHaveBeenCalledWith(
      "user@example.com",
      "Withdrawal approved",
      "Your withdrawal was approved.",
    );

    expect(notificationRepository.save).toHaveBeenCalledTimes(1);

    expect(result.getStatus()).toBe(NotificationStatus.SENT);
    expect(result.getSentAt()).toBeInstanceOf(Date);
  });

  it("records an email failure instead of throwing", async () => {
    notificationService.sendEmail.mockRejectedValue(
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

    expect(notificationRepository.create).toHaveBeenCalledTimes(1);
    expect(notificationRepository.save).toHaveBeenCalledTimes(1);
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

    expect(notificationService.sendEmail).not.toHaveBeenCalled();
    expect(notificationRepository.save).toHaveBeenCalledTimes(1);
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

    expect(notificationRepository.create).toHaveBeenCalledTimes(1);
    expect(notificationRepository.save).toHaveBeenCalledTimes(1);
  });
});
