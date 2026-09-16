import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { User } from "@domain/entities/user.entity";

import { ListUsersUseCase } from "./list-users.use-case";

describe("ListUsersUseCase", () => {
  const repository = {
    searchAdminUsers: jest.fn<() => Promise<unknown>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists users through the repository", async () => {
    const user = User.create({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    const page = {
      data: [user],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    };

    repository.searchAdminUsers.mockResolvedValue(page);

    await expect(
      new ListUsersUseCase(repository as any).execute({
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(page);

    expect(repository.searchAdminUsers).toHaveBeenCalledWith(
      {
        search: undefined,
        role: undefined,
        status: undefined,
        emailVerified: undefined,
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
