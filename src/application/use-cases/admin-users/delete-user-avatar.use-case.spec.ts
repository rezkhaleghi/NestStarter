import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { User } from "@domain/entities/user.entity";
import { UserNotFoundException } from "@domain/exceptions/domain.exception";
import { DeleteAdminUserAvatarUseCase } from "./delete-user-avatar.use-case";

describe("DeleteAdminUserAvatarUseCase", () => {
  const user = User.create({
    id: "user-id",
    email: "user@example.com",
    hashedPassword: "hashed",
  });

  const userRepository = {
    findById: jest.fn<() => Promise<User | null>>(),
    save: jest.fn<(user: User) => Promise<User>>(),
  };

  const auditLogRepository = {
    create: jest.fn<(value: unknown) => Promise<unknown>>(),
  };

  const unitOfWork = {
    execute:
      jest.fn<
        (work: (repositories: unknown) => Promise<unknown>) => Promise<unknown>
      >(),
  };

  const fileStorage = {
    delete: jest.fn<(key: string) => Promise<void>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository.save.mockImplementation(async (value: User) => value);

    auditLogRepository.create.mockImplementation(
      async (value: unknown) => value,
    );

    fileStorage.delete.mockResolvedValue(undefined);

    unitOfWork.execute.mockImplementation(
      async (work: (repositories: unknown) => Promise<unknown>) =>
        work({
          userRepository,
          auditLogRepository,
        }),
    );
  });

  it("deletes the avatar, persists the user, and records an audit log", async () => {
    user.update({
      avatar: "avatars/user-id.webp",
    });

    userRepository.findById.mockResolvedValue(user);

    const result = await new DeleteAdminUserAvatarUseCase(
      unitOfWork as any,
      fileStorage as any,
    ).execute(user.id, "admin-id");

    expect(result).toBe(user);
    expect(user.avatar).toBeNull();

    expect(userRepository.findById).toHaveBeenCalledWith(user.id);

    expect(userRepository.save).toHaveBeenCalledWith(user);

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        targetUserId: user.id,
        action: AuditAction.USER_AVATAR_DELETED,
      }),
    );

    expect(fileStorage.delete).toHaveBeenCalledWith("avatars/user-id.webp");
  });

  it("throws when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      new DeleteAdminUserAvatarUseCase(
        unitOfWork as any,
        fileStorage as any,
      ).execute("missing-user-id", "admin-id"),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
    expect(fileStorage.delete).not.toHaveBeenCalled();
  });

  it("does not create an audit log when actorUserId is empty", async () => {
    user.update({
      avatar: "avatars/user-id.webp",
    });

    userRepository.findById.mockResolvedValue(user);

    await new DeleteAdminUserAvatarUseCase(
      unitOfWork as any,
      fileStorage as any,
    ).execute(user.id, "");

    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(auditLogRepository.create).not.toHaveBeenCalled();
    expect(fileStorage.delete).toHaveBeenCalledWith("avatars/user-id.webp");
  });

  it("does not delete the physical file when the user has no avatar", async () => {
    const userWithoutAvatar = User.create({
      id: "user-without-avatar",
      email: "no-avatar@example.com",
      hashedPassword: "hashed",
    });

    userRepository.findById.mockResolvedValue(userWithoutAvatar);

    await new DeleteAdminUserAvatarUseCase(
      unitOfWork as any,
      fileStorage as any,
    ).execute(userWithoutAvatar.id, "admin-id");

    expect(userRepository.save).toHaveBeenCalledWith(userWithoutAvatar);

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.USER_AVATAR_DELETED,
      }),
    );

    expect(fileStorage.delete).not.toHaveBeenCalled();
  });

  it("does not delete the physical file when the transaction fails", async () => {
    unitOfWork.execute.mockRejectedValue(
      new Error("database transaction failed"),
    );

    await expect(
      new DeleteAdminUserAvatarUseCase(
        unitOfWork as any,
        fileStorage as any,
      ).execute(user.id, "admin-id"),
    ).rejects.toThrow("database transaction failed");

    expect(fileStorage.delete).not.toHaveBeenCalled();
  });

  it("does not delete the physical file when saving the user fails", async () => {
    user.update({
      avatar: "avatars/user-id.webp",
    });

    userRepository.findById.mockResolvedValue(user);

    userRepository.save.mockRejectedValue(new Error("save failed"));

    await expect(
      new DeleteAdminUserAvatarUseCase(
        unitOfWork as any,
        fileStorage as any,
      ).execute(user.id, "admin-id"),
    ).rejects.toThrow("save failed");

    expect(fileStorage.delete).not.toHaveBeenCalled();
  });
});
