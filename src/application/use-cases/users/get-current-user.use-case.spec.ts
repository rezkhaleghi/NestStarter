import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { GetCurrentUserUseCase } from "./get-current-user.use-case";

import { User } from "@domain/entities/user.entity";
import { UserRepository } from "@domain/repositories/user.repository";
import { UserNotFoundException } from "@domain/exceptions/domain.exception";

describe("GetCurrentUserUseCase", () => {
  let useCase: GetCurrentUserUseCase;

  const userRepository = {
    findById: jest.fn<() => Promise<User | null>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new GetCurrentUserUseCase(
      userRepository as unknown as UserRepository,
    );
  });

  it("should return the current user", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute("user-1");

    expect(result).toBe(user);
    expect(userRepository.findById).toHaveBeenCalledWith("user-1");
  });

  it("should throw UserNotFoundException when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing-user")).rejects.toBeInstanceOf(
      UserNotFoundException,
    );

    expect(userRepository.findById).toHaveBeenCalledWith("missing-user");
  });
});
