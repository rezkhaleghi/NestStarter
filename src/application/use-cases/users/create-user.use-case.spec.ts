import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserAlreadyExistsException } from "../../../domain/exceptions/domain.exception";
import { CreateUserUseCase } from "./create-user.use-case";

describe("CreateUserUseCase", () => {
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const hash = jest.fn<(password: string) => Promise<string>>();
  const save = jest.fn<(user: User) => Promise<User>>();

  const userBalanceRepository = {} as any;

  const useCase = new CreateUserUseCase(
    { findByEmail, save } as any,
    { hash } as any,
    userBalanceRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes, hashes, verifies, and saves a new user", async () => {
    findByEmail.mockResolvedValue(null);
    hash.mockResolvedValue("hashed");
    save.mockImplementation(async (user) => user);

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
  });

  it("rejects an existing email", async () => {
    findByEmail.mockResolvedValue(
      new User("id", "user@example.com", "hashed", UserRole.USER),
    );

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "password",
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsException);

    expect(findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(hash).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
