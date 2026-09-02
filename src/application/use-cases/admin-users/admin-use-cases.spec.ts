import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserStatus } from "../../../domain/enums/user-status.enum";
import { AuditAction } from "../../../domain/enums/audit-action.enum";

import {
  CannotDeleteSelfException,
  CannotRemoveLastAdminException,
  UserAlreadyExistsException,
  UserNotFoundException,
  UsernameAlreadyExistsException,
} from "../../../domain/exceptions/domain.exception";

import { CreateAdminUserUseCase } from "./create-user.use-case";
import { DeleteAdminUserUseCase } from "./delete-user.use-case";
import { GetUserUseCase } from "./get-user.use-case";
import { ListUsersUseCase } from "./list-users.use-case";
import { UpdateAdminUserUseCase } from "./update-user.use-case";

describe("admin user use cases", () => {
  const repository = {
    findById: jest.fn<() => Promise<User | null>>(),
    findByEmail: jest.fn<() => Promise<User | null>>(),
    findByUserName: jest.fn<() => Promise<User | null>>(),
    findPage: jest.fn<() => Promise<unknown>>(),
    searchAdminUsers: jest.fn<() => Promise<unknown>>(),
    save: jest.fn<(user: User) => Promise<User>>(),
    saveAdminMutation:
      jest.fn<(user: User, wasAdmin: boolean) => Promise<User | null>>(),
    deleteAdminUser: jest.fn<(id: string) => Promise<boolean>>(),
  };

  const userBalanceRepository = {
    create: jest.fn(),
    findByUserIdAndCurrency: jest.fn(),
  };

  const auditLogRepository = {
    create: jest.fn(),
  };

  const hash = jest.fn<(password: string) => Promise<string>>();

  const unitOfWork = {
    execute: jest.fn(),
  };

  const auditLogger = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWork.execute.mockImplementation(
      async (work: (repositories: any) => Promise<unknown>) =>
        work({
          userRepository: repository,
          userBalanceRepository,
          auditLogRepository,
        }),
    );

    userBalanceRepository.create.mockImplementation(
      async (balance: unknown) => balance,
    );

    auditLogRepository.create.mockImplementation(
      async (auditLog: unknown) => auditLog,
    );
  });

  describe("CreateAdminUserUseCase", () => {
    it("creates an admin user with a normalized email", async () => {
      repository.findByEmail.mockResolvedValue(null);
      hash.mockResolvedValue("hashed");

      repository.save.mockImplementation(async (user) => user);

      const useCase = new CreateAdminUserUseCase(
        { hash } as any,
        unitOfWork as any,
      );

      const result = await useCase.execute(
        {
          email: " ADMIN@example.com ",
          password: "password123",
          role: UserRole.ADMIN,
        },
        "admin-user-id",
      );

      expect(result.email).toBe("admin@example.com");
      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.hashedPassword).toBe("hashed");
      expect(result.emailVerified).toBe(true);

      expect(repository.findByEmail).toHaveBeenCalledWith("admin@example.com");

      expect(hash).toHaveBeenCalledWith("password123");

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "admin@example.com",
          hashedPassword: "hashed",
          role: UserRole.ADMIN,
          emailVerified: true,
        }),
      );

      expect(userBalanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: result.id,
          currency: expect.anything(),
          amount: "0",
        }),
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorUserId: "admin-user-id",
          targetUserId: result.id,
          action: AuditAction.USER_CREATED,
          metadata: {
            email: "admin@example.com",
            role: UserRole.ADMIN,
          },
        }),
      );

      expect(unitOfWork.execute).toHaveBeenCalled();
    });

    it("rejects duplicate admin email", async () => {
      repository.findByEmail.mockResolvedValue(
        User.create({
          id: "id",
          email: "admin@example.com",
          hashedPassword: "hashed",
          role: UserRole.ADMIN,
          emailVerified: true,
        }),
      );

      const useCase = new CreateAdminUserUseCase(
        { hash } as any,
        unitOfWork as any,
      );

      await expect(
        useCase.execute(
          {
            email: "admin@example.com",
            password: "password",
            role: UserRole.ADMIN,
          },
          "admin-user-id",
        ),
      ).rejects.toBeInstanceOf(UserAlreadyExistsException);

      expect(repository.save).not.toHaveBeenCalled();
      expect(userBalanceRepository.create).not.toHaveBeenCalled();
      expect(auditLogRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("GetUserUseCase / ListUsersUseCase", () => {
    it("gets and lists users through the repository", async () => {
      const user = User.create({
        id: "id",
        email: "user@example.com",
        hashedPassword: "hashed",
      });

      repository.findById.mockResolvedValue(user);

      const page = {
        data: [user],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      };

      repository.searchAdminUsers.mockResolvedValue(page);

      await expect(
        new GetUserUseCase(repository as any).execute("id"),
      ).resolves.toBe(user);

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

    it("rejects missing users", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        new GetUserUseCase(repository as any).execute("missing"),
      ).rejects.toBeInstanceOf(UserNotFoundException);
    });
  });

  describe("DeleteAdminUserUseCase", () => {
    it("rejects deleting yourself", async () => {
      repository.findById.mockResolvedValue(
        new User("id", "admin@example.com", "hashed", UserRole.ADMIN),
      );

      const useCase = new DeleteAdminUserUseCase(
        repository as any,
        auditLogger as any,
      );

      await expect(useCase.execute("id", "id")).rejects.toBeInstanceOf(
        CannotDeleteSelfException,
      );

      expect(repository.deleteAdminUser).not.toHaveBeenCalled();
      expect(auditLogger.log).not.toHaveBeenCalled();
    });

    it("rejects deleting the last admin", async () => {
      repository.findById.mockResolvedValue(
        new User("id", "admin@example.com", "hashed", UserRole.ADMIN),
      );

      repository.deleteAdminUser.mockResolvedValue(false);

      const useCase = new DeleteAdminUserUseCase(
        repository as any,
        auditLogger as any,
      );

      await expect(useCase.execute("id", "other")).rejects.toBeInstanceOf(
        CannotRemoveLastAdminException,
      );

      expect(repository.deleteAdminUser).toHaveBeenCalledWith("id");
      expect(auditLogger.log).not.toHaveBeenCalled();
    });

    it("deletes a user and creates an audit log", async () => {
      const user = new User(
        "user-id",
        "user@example.com",
        "hashed",
        UserRole.USER,
      );

      repository.findById.mockResolvedValue(user);
      repository.deleteAdminUser.mockResolvedValue(true);

      const useCase = new DeleteAdminUserUseCase(
        repository as any,
        auditLogger as any,
      );

      await expect(
        useCase.execute("user-id", "admin-id"),
      ).resolves.toBeUndefined();

      expect(repository.deleteAdminUser).toHaveBeenCalledWith("user-id");

      expect(auditLogger.log).toHaveBeenCalledWith({
        actorUserId: "admin-id",
        targetUserId: "user-id",
        action: AuditAction.USER_DELETED,
        metadata: {
          email: "user@example.com",
          role: UserRole.USER,
        },
      });
    });
  });

  describe("UpdateAdminUserUseCase", () => {
    it("updates profile data and creates an audit log", async () => {
      const user = new User(
        "id",
        "user@example.com",
        "old-hash",
        UserRole.USER,
        true,
      );

      repository.findById.mockResolvedValue(user);
      repository.findByUserName.mockResolvedValue(null);

      repository.saveAdminMutation.mockImplementation(
        async (updated) => updated,
      );

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
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

      expect(auditLogger.log).toHaveBeenCalledWith({
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
      });
    });

    it("rejects duplicate usernames", async () => {
      const user = new User(
        "id",
        "user@example.com",
        "old-hash",
        UserRole.USER,
        true,
      );

      repository.findById.mockResolvedValue(user);

      repository.findByUserName.mockResolvedValue(
        new User("other", "other@example.com", "old-hash", UserRole.USER),
      );

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
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
      expect(auditLogger.log).not.toHaveBeenCalled();
    });

    it("rejects duplicate emails", async () => {
      const user = new User(
        "id",
        "user@example.com",
        "old-hash",
        UserRole.USER,
        true,
      );

      repository.findById.mockResolvedValue(user);

      repository.findByEmail.mockResolvedValue(
        new User("other", "other@example.com", "old-hash", UserRole.USER),
      );

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
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
      expect(auditLogger.log).not.toHaveBeenCalled();
    });

    it("changes the password and creates a password audit log", async () => {
      const user = new User(
        "id",
        "user@example.com",
        "old-hash",
        UserRole.USER,
        true,
      );

      repository.findById.mockResolvedValue(user);

      repository.saveAdminMutation.mockImplementation(
        async (updated) => updated,
      );

      hash.mockResolvedValue("new-hash");

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
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

      expect(auditLogger.log).toHaveBeenCalledWith({
        actorUserId: "admin-id",
        targetUserId: "id",
        action: AuditAction.USER_PASSWORD_CHANGED,
        metadata: {
          email: "user@example.com",
        },
      });
    });

    it("changes the role and creates a role audit log", async () => {
      const user = new User(
        "id",
        "user@example.com",
        "old-hash",
        UserRole.USER,
        true,
      );

      repository.findById.mockResolvedValue(user);

      repository.saveAdminMutation.mockImplementation(
        async (updated) => updated,
      );

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
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

      expect(auditLogger.log).toHaveBeenCalledWith({
        actorUserId: "admin-id",
        targetUserId: "id",
        action: AuditAction.USER_ROLE_CHANGED,
        metadata: {
          from: UserRole.USER,
          to: UserRole.ADMIN,
        },
      });
    });

    it("prevents demoting the last admin", async () => {
      const user = new User(
        "id",
        "admin@example.com",
        "old-hash",
        UserRole.ADMIN,
        true,
      );

      repository.findById.mockResolvedValue(user);

      repository.saveAdminMutation.mockResolvedValue(null);

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
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

      expect(auditLogger.log).not.toHaveBeenCalled();
    });

    it("changes account status and creates an update audit log", async () => {
      const user = new User(
        "id",
        "user@example.com",
        "old-hash",
        UserRole.USER,
        true,
      );

      repository.findById.mockResolvedValue(user);

      repository.saveAdminMutation.mockImplementation(
        async (updated) => updated,
      );

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
      );

      const result = await useCase.execute(
        {
          id: "id",
          status: UserStatus.RESTRICTED,
        },
        "admin-id",
      );

      expect(result.status).toBe(UserStatus.RESTRICTED);

      expect(auditLogger.log).toHaveBeenCalledWith({
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
      });
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

      repository.findById.mockResolvedValue(user);

      repository.saveAdminMutation.mockImplementation(
        async (updated) => updated,
      );

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
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

      expect(auditLogger.log).toHaveBeenCalledWith({
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
      });
    });

    it("does not create an update audit log when nothing changed", async () => {
      const user = new User(
        "id",
        "user@example.com",
        "old-hash",
        UserRole.USER,
        true,
      );

      repository.findById.mockResolvedValue(user);

      repository.saveAdminMutation.mockImplementation(
        async (updated) => updated,
      );

      const useCase = new UpdateAdminUserUseCase(
        repository as any,
        { hash } as any,
        auditLogger as any,
      );

      await useCase.execute(
        {
          id: "id",
        },
        "admin-id",
      );

      expect(auditLogger.log).not.toHaveBeenCalled();
    });
  });
});
