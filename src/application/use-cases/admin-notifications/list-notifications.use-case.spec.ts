import { AdminListNotificationsUseCase } from "./list-notifications.use-case";

import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationStatus } from "@domain/enums/notification-status.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";

describe("AdminListNotificationsUseCase", () => {
  const notificationRepository = {
    findPage: jest.fn(),
  };

  let useCase: AdminListNotificationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationRepository.findPage.mockResolvedValue({
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

    useCase = new AdminListNotificationsUseCase(notificationRepository);
  });

  it("lists notifications with filters and pagination", async () => {
    await useCase.execute({
      userId: "user-1",
      type: NotificationType.WITHDRAWAL_APPROVED,
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.SENT,
      from: new Date("2026-01-01"),
      to: new Date("2026-01-31"),
      page: 2,
      limit: 10,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });

    expect(notificationRepository.findPage).toHaveBeenCalledWith(
      {
        userId: "user-1",
        type: NotificationType.WITHDRAWAL_APPROVED,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.SENT,
        from: new Date("2026-01-01"),
        to: new Date("2026-01-31"),
      },
      {
        page: 2,
        limit: 10,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });

  it("lists all notifications when no filters are supplied", async () => {
    await useCase.execute({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });

    expect(notificationRepository.findPage).toHaveBeenCalledWith(
      {
        userId: undefined,
        type: undefined,
        channel: undefined,
        status: undefined,
        from: undefined,
        to: undefined,
      },
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });
});
