import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { User } from "@domain/entities/user.entity";

import { UserNotFoundException } from "@domain/exceptions/domain.exception";

import { GetUserUseCase } from "./get-user.use-case";

describe("GetUserUseCase", () => {
  const repository = {
    findById: jest.fn<() => Promise<User | null>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gets a user through the repository", async () => {
    const user = User.create({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    repository.findById.mockResolvedValue(user);

    await expect(
      new GetUserUseCase(repository as any).execute("id"),
    ).resolves.toBe(user);

    expect(repository.findById).toHaveBeenCalledWith("id");
  });

  it("rejects missing users", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      new GetUserUseCase(repository as any).execute("missing"),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });
});
