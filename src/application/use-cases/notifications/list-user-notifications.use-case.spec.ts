import { ListUserNotificationsUseCase } from "./list-user-notifications.use-case";

describe("ListUserNotificationsUseCase", () => {
  const notificationRepository = {
    findByUserId: jest.fn(),
  };

  let useCase: ListUserNotificationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationRepository.findByUserId.mockResolvedValue({
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

    expect(notificationRepository.findByUserId).toHaveBeenCalledWith("user-1", {
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });
  });
});
