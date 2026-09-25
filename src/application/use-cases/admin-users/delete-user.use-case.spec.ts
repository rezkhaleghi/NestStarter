import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { User } from "@domain/entities/user.entity";
import { UserRole } from "@domain/enums/user-role.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  CannotDeleteSelfException,
  CannotRemoveLastAdminException,
} from "@domain/exceptions/domain.exception";

import { DeleteAdminUserUseCase } from "./delete-user.use-case";

describe("DeleteAdminUserUseCase", () => {
  const repository = {
    findByIdForUpdate: jest.fn<() => Promise<User | null>>(),
    deleteAdminUser: jest.fn<(id: string) => Promise<boolean>>(),
  };

  const auditLogRepository = {
    create: jest.fn(),
  };

  const unitOfWork = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWork.execute.mockImplementation(
      async (work: (repositories: any) => Promise<unknown>) =>
        work({
          userRepository: repository,
          auditLogRepository,
        }),
    );

    auditLogRepository.create.mockImplementation(
      async (auditLog: unknown) => auditLog,
    );
  });

  it("rejects deleting yourself", async () => {
    repository.findByIdForUpdate.mockResolvedValue(
      User.create({
        id: "id",
        email: "admin@example.com",
        hashedPassword: "hashed",
        role: UserRole.ADMIN,
      }),
    );

    const useCase = new DeleteAdminUserUseCase(unitOfWork as any);

    await expect(useCase.execute("id", "id")).rejects.toBeInstanceOf(
      CannotDeleteSelfException,
    );

    expect(repository.deleteAdminUser).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("rejects deleting the last admin", async () => {
    repository.findByIdForUpdate.mockResolvedValue(
      User.create({
        id: "id",
        email: "admin@example.com",
        hashedPassword: "hashed",
        role: UserRole.ADMIN,
      }),
    );
    repository.deleteAdminUser.mockResolvedValue(false);

    const useCase = new DeleteAdminUserUseCase(unitOfWork as any);

    await expect(useCase.execute("id", "other")).rejects.toBeInstanceOf(
      CannotRemoveLastAdminException,
    );

    expect(repository.deleteAdminUser).toHaveBeenCalledWith("id");
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("deletes a user and creates an audit log", async () => {
    const user = User.create({
      id: "user-id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
    });

    repository.findByIdForUpdate.mockResolvedValue(user);
    repository.deleteAdminUser.mockResolvedValue(true);

    const useCase = new DeleteAdminUserUseCase(unitOfWork as any);

    await expect(
      useCase.execute("user-id", "admin-id"),
    ).resolves.toBeUndefined();

    expect(repository.deleteAdminUser).toHaveBeenCalledWith("user-id");

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        targetUserId: "user-id",
        action: AuditAction.USER_DELETED,
        metadata: {
          email: "user@example.com",
          role: UserRole.USER,
        },
      }),
    );
  });
});
