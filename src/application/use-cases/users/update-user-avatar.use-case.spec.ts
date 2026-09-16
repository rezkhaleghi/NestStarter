import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { UpdateUserAvatarUseCase } from "./update-user-avatar.use-case";

import { User } from "@domain/entities/user.entity";
import { UserRepository } from "@domain/repositories/user.repository";
import { FileStorage } from "@application/interfaces/file-storage.interface";
import { ImageProcessing } from "@application/interfaces/image-processing.interface";
import { UserNotFoundException } from "@domain/exceptions/domain.exception";

describe("UpdateUserAvatarUseCase", () => {
  let useCase: UpdateUserAvatarUseCase;

  const userRepository = {
    findById: jest.fn<() => Promise<User | null>>(),
    save: jest.fn<(user: User) => Promise<User>>(),
  };

  const fileStorage = {
    upload:
      jest.fn<
        (
          objectName: string,
          buffer: Buffer,
          contentType: string,
        ) => Promise<void>
      >(),
    delete: jest.fn<(objectName: string) => Promise<void>>(),
  };

  const imageProcessing = {
    processAvatar: jest.fn<(buffer: Buffer) => Promise<Buffer>>(),
  };

  const file = {
    buffer: Buffer.from("original-image"),
    mimetype: "image/jpeg",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository.save.mockImplementation(async (user: User) => user);

    fileStorage.upload.mockResolvedValue(undefined);
    fileStorage.delete.mockResolvedValue(undefined);

    imageProcessing.processAvatar.mockResolvedValue(
      Buffer.from("processed-image"),
    );

    useCase = new UpdateUserAvatarUseCase(
      userRepository as unknown as UserRepository,
      fileStorage as unknown as FileStorage,
      imageProcessing as unknown as ImageProcessing,
    );
  });

  it("should process and upload the avatar", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute("user-1", file);

    expect(imageProcessing.processAvatar).toHaveBeenCalledWith(file.buffer);

    expect(fileStorage.upload).toHaveBeenCalledWith(
      "avatars/user-1/avatar.webp",
      Buffer.from("processed-image"),
      "image/webp",
    );

    expect(result.avatar).toBe("avatars/user-1/avatar.webp");
  });

  it("should save the user after the new avatar is uploaded", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    await useCase.execute("user-1", file);

    expect(fileStorage.upload.mock.invocationCallOrder[0]).toBeLessThan(
      userRepository.save.mock.invocationCallOrder[0],
    );
  });

  it("should delete the old avatar after saving the new avatar", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    user.update({
      avatar: "avatars/user-1/old-avatar.webp",
    });

    userRepository.findById.mockResolvedValue(user);

    await useCase.execute("user-1", file);

    expect(fileStorage.delete).toHaveBeenCalledWith(
      "avatars/user-1/old-avatar.webp",
    );

    expect(userRepository.save.mock.invocationCallOrder[0]).toBeLessThan(
      fileStorage.delete.mock.invocationCallOrder[0],
    );
  });

  it("should not delete an old avatar when there was none", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    await useCase.execute("user-1", file);

    expect(fileStorage.delete).not.toHaveBeenCalled();
  });

  it("should not delete the old avatar when it is the same object", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    user.update({
      avatar: "avatars/user-1/avatar.webp",
    });

    userRepository.findById.mockResolvedValue(user);

    await useCase.execute("user-1", file);

    expect(fileStorage.delete).not.toHaveBeenCalled();
  });

  it("should throw UserNotFoundException when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing-user", file)).rejects.toBeInstanceOf(
      UserNotFoundException,
    );

    expect(imageProcessing.processAvatar).not.toHaveBeenCalled();
    expect(fileStorage.upload).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("should not save the user when image processing fails", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    const processingError = new Error("Image processing failed");

    imageProcessing.processAvatar.mockRejectedValue(processingError);

    await expect(useCase.execute("user-1", file)).rejects.toBe(processingError);

    expect(fileStorage.upload).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("should not save the user when file upload fails", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    const uploadError = new Error("Upload failed");

    fileStorage.upload.mockRejectedValue(uploadError);

    await expect(useCase.execute("user-1", file)).rejects.toBe(uploadError);

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(fileStorage.delete).not.toHaveBeenCalled();
  });

  it("should delete the newly uploaded file when saving the user fails", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    const databaseError = new Error("Database update failed");

    userRepository.save.mockRejectedValue(databaseError);

    await expect(useCase.execute("user-1", file)).rejects.toBe(databaseError);

    expect(fileStorage.upload).toHaveBeenCalledWith(
      "avatars/user-1/avatar.webp",
      Buffer.from("processed-image"),
      "image/webp",
    );

    expect(fileStorage.delete).toHaveBeenCalledWith(
      "avatars/user-1/avatar.webp",
    );
  });

  it("should preserve the original database error when cleanup also fails", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(user);

    const databaseError = new Error("Database update failed");
    const cleanupError = new Error("Cleanup failed");

    userRepository.save.mockRejectedValue(databaseError);
    fileStorage.delete.mockRejectedValue(cleanupError);

    await expect(useCase.execute("user-1", file)).rejects.toBe(databaseError);

    expect(fileStorage.delete).toHaveBeenCalledWith(
      "avatars/user-1/avatar.webp",
    );
  });
});
