import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import {
  UserNotFoundException,
  UsernameAlreadyExistsException,
} from "../../../domain/exceptions/domain.exception";
import { UpdateCurrentUserUseCase } from "./update-current-user.use-case";

describe("UpdateCurrentUserUseCase", () => {
  const findById = jest.fn<() => Promise<User | null>>();
  const findByUserName = jest.fn<() => Promise<User | null>>();
  const save = jest.fn<(user: User) => Promise<User>>();
  const useCase = new UpdateCurrentUserUseCase({
    findById,
    findByUserName,
    save,
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates supplied fields and preserves omitted fields", async () => {
    const existing = new User(
      "id",
      "user@example.com",
      "hashed",
      undefined,
      true,
      new Date(),
      new Date(),
      "google",
      "Old",
      "Name",
      "old_name",
      new Date("1990-01-01"),
    );
    findById.mockResolvedValue(existing);
    findByUserName.mockResolvedValue(null);
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute("userId", {
      firstName: "New",
      userName: "new_name",
    });

    expect(result.firstName).toBe("New");
    expect(result.lastName).toBe("Name");
    expect(result.userName).toBe("new_name");
    expect(result.dateOfBirth).toEqual(new Date("1990-01-01"));
  });

  it("rejects a duplicate username", async () => {
    findById.mockResolvedValue(new User("id", "user@example.com", "hashed"));
    findByUserName.mockResolvedValue(
      new User("other", "other@example.com", "hashed"),
    );
    await expect(
      useCase.execute("userId", { userName: "taken" }),
    ).rejects.toBeInstanceOf(UsernameAlreadyExistsException);
  });

  it("rejects a missing user", async () => {
    findById.mockResolvedValue(null);
    await expect(
      useCase.execute("", { userName: "missing" }),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });
});
