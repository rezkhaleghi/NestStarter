import { ListUserNotificationsUseCase } from "./list-user-notifications.use-case";

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
    );
  });
});
