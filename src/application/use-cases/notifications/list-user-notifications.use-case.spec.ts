import { ListUserNotificationsUseCase } from "./list-user-notifications.use-case";

import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";
import { NotificationRepository } from "@domain/repositories/notification.repository";

describe("ListUserNotificationsUseCase", () => {
  const notificationRepositoryMock = {
    findByUserId: jest.fn(),
  };

  const notificationRepository =
    notificationRepositoryMock as unknown as NotificationRepository;

  let useCase: ListUserNotificationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationRepositoryMock.findByUserId.mockResolvedValue({
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

    useCase = new ListUserNotificationsUseCase(notificationRepository);
  });

  it("lists notifications belonging to the current user", async () => {
    await useCase.execute({
      userId: "user-1",
      page: 1,
      limit: 20,
    });

    expect(notificationRepositoryMock.findByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
      {
        channel: undefined,
        type: undefined,
      },
    );
  });

  it("filters the user's notifications by channel", async () => {
    await useCase.execute({
      userId: "user-1",
      page: 1,
      limit: 20,
      channel: NotificationChannel.IN_APP,
    });

    expect(notificationRepositoryMock.findByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
      {
        channel: NotificationChannel.IN_APP,
        type: undefined,
      },
    );
  });

  it("filters the user's notifications by type", async () => {
    await useCase.execute({
      userId: "user-1",
      page: 1,
      limit: 20,
      type: NotificationType.WITHDRAWAL_APPROVED,
    });

    expect(notificationRepositoryMock.findByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
      {
        channel: undefined,
        type: NotificationType.WITHDRAWAL_APPROVED,
      },
    );
  });

  it("filters the user's notifications by channel and type", async () => {
    await useCase.execute({
      userId: "user-1",
      page: 1,
      limit: 20,
      channel: NotificationChannel.IN_APP,
      type: NotificationType.WITHDRAWAL_APPROVED,
    });

    expect(notificationRepositoryMock.findByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
      {
        channel: NotificationChannel.IN_APP,
        type: NotificationType.WITHDRAWAL_APPROVED,
      },
    );
  });
});
