import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserAlreadyExistsException } from "../../../domain/exceptions/domain.exception";

import { CreateUserUseCase } from "./create-user.use-case";

describe("CreateUserUseCase", () => {
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const save = jest.fn<(user: User) => Promise<User>>();
  const createBalance = jest.fn();

  const hash = jest.fn<(password: string) => Promise<string>>();

  const unitOfWork = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWork.execute.mockImplementation(
      async (work: (repositories: any) => Promise<unknown>) =>
        work({
          userRepository: {
            findByEmail,
            save,
          },
          userBalanceRepository: {
            create: createBalance,
          },
        }),
    );
  });

  it("normalizes, hashes, verifies, and saves a new user", async () => {
    findByEmail.mockResolvedValue(null);
    hash.mockResolvedValue("hashed");
    save.mockImplementation(async (user) => user);
    createBalance.mockImplementation(async (balance) => balance);

    const useCase = new CreateUserUseCase({ hash } as any, unitOfWork as any);

    const result = await useCase.execute({
      email: " USER@example.com ",
      password: "password",
    });

    expect(result.email).toBe("user@example.com");
    expect(result.hashedPassword).toBe("hashed");
    expect(result.role).toBe(UserRole.USER);
    expect(result.emailVerified).toBe(true);

    expect(findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(hash).toHaveBeenCalledWith("password");

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        hashedPassword: "hashed",
        role: UserRole.USER,
        emailVerified: true,
      }),
    );

    expect(createBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: result.id,
        amount: "0",
      }),
    );

    expect(unitOfWork.execute).toHaveBeenCalled();
  });

  it("rejects an existing email", async () => {
    findByEmail.mockResolvedValue(
      User.create({
        id: "id",
        email: "user@example.com",
        hashedPassword: "hashed",
      }),
    );

    const useCase = new CreateUserUseCase({ hash } as any, unitOfWork as any);

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "password",
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsException);

    expect(findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(hash).toHaveBeenCalledWith("password");
    expect(save).not.toHaveBeenCalled();
    expect(createBalance).not.toHaveBeenCalled();
  });
});
