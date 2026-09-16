import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { User } from "@domain/entities/user.entity";
import { UserRole } from "@domain/enums/user-role.enum";
import { UserStatus } from "@domain/enums/user-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  CannotRemoveLastAdminException,
  UserAlreadyExistsException,
  UsernameAlreadyExistsException,
} from "@domain/exceptions/domain.exception";

import { UpdateAdminUserUseCase } from "./update-user.use-case";

describe("UpdateAdminUserUseCase", () => {
  const repository = {
    findByIdForUpdate: jest.fn<() => Promise<User | null>>(),
    findByEmail: jest.fn<() => Promise<User | null>>(),
    findByUserName: jest.fn<() => Promise<User | null>>(),
    saveAdminMutation:
      jest.fn<(user: User, wasAdmin: boolean) => Promise<User | null>>(),
  };

  const auditLogRepository = {
    create: jest.fn(),
  };

  const hash = jest.fn<(password: string) => Promise<string>>();

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

  it("updates profile data and creates an audit log", async () => {
    const user = new User(
      "id",
      "user@example.com",
      "old-hash",
      UserRole.USER,
      true,
    );

    repository.findByIdForUpdate.mockResolvedValue(user);
    repository.findByUserName.mockResolvedValue(null);

    repository.saveAdminMutation.mockImplementation(async (updated) => updated);

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    const result = await useCase.execute(
      {
        id: "id",
        firstName: "Jane",
        lastName: "Doe",
        userName: "jane",
        bio: "Updated bio",
      },
      "admin-id",
    );

    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Doe");
    expect(result.userName).toBe("jane");
    expect(result.bio).toBe("Updated bio");

    expect(repository.saveAdminMutation).toHaveBeenCalledWith(user, false);

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        targetUserId: "id",
        action: AuditAction.USER_UPDATED,
        metadata: {
          changes: {
            firstName: {
              from: null,
              to: "Jane",
            },
            lastName: {
              from: null,
              to: "Doe",
            },
            userName: {
              from: null,
              to: "jane",
            },
            bio: {
              from: null,
              to: "Updated bio",
            },
          },
        },
      }),
    );
  });

  it("rejects duplicate usernames", async () => {
    const user = new User(
      "id",
      "user@example.com",
      "old-hash",
      UserRole.USER,
      true,
    );

    repository.findByIdForUpdate.mockResolvedValue(user);

    repository.findByUserName.mockResolvedValue(
      new User("other", "other@example.com", "old-hash", UserRole.USER),
    );

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    await expect(
      useCase.execute(
        {
          id: "id",
          userName: "taken",
        },
        "admin-id",
      ),
    ).rejects.toBeInstanceOf(UsernameAlreadyExistsException);

    expect(repository.saveAdminMutation).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate emails", async () => {
    const user = new User(
      "id",
      "user@example.com",
      "old-hash",
      UserRole.USER,
      true,
    );

    repository.findByIdForUpdate.mockResolvedValue(user);

    repository.findByEmail.mockResolvedValue(
      new User("other", "other@example.com", "old-hash", UserRole.USER),
    );

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    await expect(
      useCase.execute(
        {
          id: "id",
          email: "other@example.com",
        },
        "admin-id",
      ),
    ).rejects.toBeInstanceOf(UserAlreadyExistsException);

    expect(repository.saveAdminMutation).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("changes the password and creates a password audit log", async () => {
    const user = new User(
      "id",
      "user@example.com",
      "old-hash",
      UserRole.USER,
      true,
    );

    repository.findByIdForUpdate.mockResolvedValue(user);

    repository.saveAdminMutation.mockImplementation(async (updated) => updated);

    hash.mockResolvedValue("new-hash");

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    const result = await useCase.execute(
      {
        id: "id",
        password: "new-password",
      },
      "admin-id",
    );

    expect(hash).toHaveBeenCalledWith("new-password");
    expect(result.hashedPassword).toBe("new-hash");

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        targetUserId: "id",
        action: AuditAction.USER_PASSWORD_CHANGED,
        metadata: {
          email: "user@example.com",
        },
      }),
    );
  });

  it("changes the role and creates a role audit log", async () => {
    const user = new User(
      "id",
      "user@example.com",
      "old-hash",
      UserRole.USER,
      true,
    );

    repository.findByIdForUpdate.mockResolvedValue(user);

    repository.saveAdminMutation.mockImplementation(async (updated) => updated);

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    const result = await useCase.execute(
      {
        id: "id",
        role: UserRole.ADMIN,
      },
      "admin-id",
    );

    expect(result.role).toBe(UserRole.ADMIN);

    expect(repository.saveAdminMutation).toHaveBeenCalledWith(user, false);

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        targetUserId: "id",
        action: AuditAction.USER_ROLE_CHANGED,
        metadata: {
          from: UserRole.USER,
          to: UserRole.ADMIN,
        },
      }),
    );
  });

  it("prevents demoting the last admin", async () => {
    const user = new User(
      "id",
      "admin@example.com",
      "old-hash",
      UserRole.ADMIN,
      true,
    );

    repository.findByIdForUpdate.mockResolvedValue(user);

    repository.saveAdminMutation.mockResolvedValue(null);

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    await expect(
      useCase.execute(
        {
          id: "id",
          role: UserRole.USER,
        },
        "other-admin-id",
      ),
    ).rejects.toBeInstanceOf(CannotRemoveLastAdminException);

    expect(repository.saveAdminMutation).toHaveBeenCalledWith(user, true);

    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("changes account status and creates an update audit log", async () => {
    const user = new User(
      "id",
      "user@example.com",
      "old-hash",
      UserRole.USER,
      true,
    );

    repository.findByIdForUpdate.mockResolvedValue(user);

    repository.saveAdminMutation.mockImplementation(async (updated) => updated);

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    const result = await useCase.execute(
      {
        id: "id",
        status: UserStatus.RESTRICTED,
      },
      "admin-id",
    );

    expect(result.status).toBe(UserStatus.RESTRICTED);

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        targetUserId: "id",
        action: AuditAction.USER_UPDATED,
        metadata: {
          changes: {
            status: {
              from: UserStatus.ACTIVE,
              to: UserStatus.RESTRICTED,
            },
          },
        },
      }),
    );
  });

  it("can explicitly clear nullable profile fields", async () => {
    const user = new User(
      "id",
      "user@example.com",
      "old-hash",
      UserRole.USER,
      true,
      new Date(),
      new Date(),
      null,
      "John",
      "Doe",
      "john",
      new Date("2000-01-01"),
      "avatars/id/avatar.webp",
      "Old bio",
    );

    repository.findByIdForUpdate.mockResolvedValue(user);

    repository.saveAdminMutation.mockImplementation(async (updated) => updated);

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    const result = await useCase.execute(
      {
        id: "id",
        firstName: null,
        lastName: null,
        userName: null,
        dateOfBirth: null,
        bio: null,
      },
      "admin-id",
    );

    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
    expect(result.userName).toBeNull();
    expect(result.dateOfBirth).toBeNull();
    expect(result.bio).toBeNull();

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        targetUserId: "id",
        action: AuditAction.USER_UPDATED,
        metadata: {
          changes: {
            firstName: {
              from: "John",
              to: null,
            },
            lastName: {
              from: "Doe",
              to: null,
            },
            userName: {
              from: "john",
              to: null,
            },
            dateOfBirth: {
              from: new Date("2000-01-01"),
              to: null,
            },
            bio: {
              from: "Old bio",
              to: null,
            },
          },
        },
      }),
    );
  });

  it("does not create an update audit log when nothing changed", async () => {
    const user = new User(
      "id",
      "user@example.com",
      "old-hash",
      UserRole.USER,
      true,
    );

    repository.findByIdForUpdate.mockResolvedValue(user);

    repository.saveAdminMutation.mockImplementation(async (updated) => updated);

    const useCase = new UpdateAdminUserUseCase(
      { hash } as any,
      unitOfWork as any,
    );

    await useCase.execute(
      {
        id: "id",
      },
      "admin-id",
    );

    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
