import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { InvalidCredentialsException } from "../../../domain/exceptions/domain.exception";
import { LoginWithPasswordUseCase } from "./login-with-password.use-case";

describe("LoginWithPasswordUseCase", () => {
  const user = new User("user-id", "user@example.com", "hashed-password", undefined, true);
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const compare = jest.fn<(plain: string, hashed: string) => Promise<boolean>>();
  const loginProtection = {
    isLocked: jest.fn<() => Promise<boolean>>(),
    recordFailure: jest.fn<() => Promise<void>>(),
    clear: jest.fn<() => Promise<void>>(),
  };
  const useCase = new LoginWithPasswordUseCase(
    { findByEmail } as any,
    { compare } as any,
    loginProtection,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    loginProtection.isLocked.mockResolvedValue(false);
  });

  it("authenticates a password user", async () => {
    findByEmail.mockResolvedValue(user);
    compare.mockResolvedValue(true);

    await expect(useCase.execute({ email: " USER@example.com ", password: "password" })).resolves.toBe(user);
  });

  it("rejects an invalid password", async () => {
    findByEmail.mockResolvedValue(user);
    compare.mockResolvedValue(false);

    await expect(useCase.execute({ email: user.email, password: "wrong" })).rejects.toBeInstanceOf(InvalidCredentialsException);
  });
});