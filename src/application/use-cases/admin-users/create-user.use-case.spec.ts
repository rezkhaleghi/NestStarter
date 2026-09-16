import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { User } from "@domain/entities/user.entity";
import { UserRole } from "@domain/enums/user-role.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import { UserAlreadyExistsException } from "@domain/exceptions/domain.exception";

import { CreateAdminUserUseCase } from "./create-user.use-case";

describe("CreateAdminUserUseCase", () => {
  const repository = {
    findByEmail: jest.fn<() => Promise<User | null>>(),
    save: jest.fn<(user: User) => Promise<User>>(),
  };

  const userBalanceRepository = {
    create: jest.fn(),
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
