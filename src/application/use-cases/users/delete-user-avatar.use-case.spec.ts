import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { DeleteUserAvatarUseCase } from "./delete-user-avatar.use-case";

import { User } from "@domain/entities/user.entity";
import { UserRepository } from "@domain/repositories/user.repository";
import { FileStorage } from "@application/interfaces/file-storage.interface";
import { UserNotFoundException } from "@domain/exceptions/domain.exception";

describe("DeleteUserAvatarUseCase", () => {
  let useCase: DeleteUserAvatarUseCase;

  const userRepository = {
    findById: jest.fn<() => Promise<User | null>>(),
    save: jest.fn<(user: User) => Promise<User>>(),
  };

  const fileStorage = {
    delete: jest.fn<(path: string) => Promise<void>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository.save.mockImplementation(async (user: User) => user);

    fileStorage.delete.mockResolvedValue(undefined);

    useCase = new DeleteUserAvatarUseCase(
      userRepository as unknown as UserRepository,
      fileStorage as unknown as FileStorage,
    );
  });

  it("should remove the avatar from the user", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    user.update({
      avatar: "avatars/user-1/avatar.webp",
    });

    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute("user-1");

    expect(result).toBe(user);
    expect(result.avatar).toBeNull();

    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it("should delete the old physical avatar after saving the user", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    user.update({
      avatar: "avatars/user-1/avatar.webp",
    });

    userRepository.findById.mockResolvedValue(user);

    await useCase.execute("user-1");

    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(fileStorage.delete).toHaveBeenCalledWith(
      "avatars/user-1/avatar.webp",
    );

    expect(userRepository.save.mock.invocationCallOrder[0]).toBeLessThan(
      fileStorage.delete.mock.invocationCallOrder[0],
    );
  });

  it("should not delete anything when the user has no avatar", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    await useCase.execute("user-1");

    expect(user.avatar).toBeNull();
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(fileStorage.delete).not.toHaveBeenCalled();
  });

  it("should throw UserNotFoundException when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing-user")).rejects.toBeInstanceOf(
      UserNotFoundException,
    );

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(fileStorage.delete).not.toHaveBeenCalled();
  });

  it("should propagate a storage deletion error after the database update", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    user.update({
      avatar: "avatars/user-1/avatar.webp",
    });

    userRepository.findById.mockResolvedValue(user);

    const storageError = new Error("Storage unavailable");
    fileStorage.delete.mockRejectedValue(storageError);

    await expect(useCase.execute("user-1")).rejects.toBe(storageError);

    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(fileStorage.delete).toHaveBeenCalledWith(
      "avatars/user-1/avatar.webp",
    );

    // Database reference has already been cleared.
    expect(user.avatar).toBeNull();
  });
});
