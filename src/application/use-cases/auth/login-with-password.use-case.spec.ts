import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { InvalidCredentialsException } from "../../../domain/exceptions/domain.exception";
import { LoginWithPasswordUseCase } from "./login-with-password.use-case";

describe("LoginWithPasswordUseCase", () => {
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const compare =
    jest.fn<(plain: string, hashed: string) => Promise<boolean>>();

  const loginProtection = {
    isLocked: jest.fn<(identifier: string) => Promise<boolean>>(),
    recordFailure: jest.fn<(identifier: string) => Promise<void>>(),
    clear: jest.fn<(identifier: string) => Promise<void>>(),
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
    const user = new User(
      "user-id",
      "user@example.com",
      "hashed-password",
      undefined,
      true,
    );

    findByEmail.mockResolvedValue(user);
    compare.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: " USER@example.com ",
        password: "password",
      }),
    ).resolves.toBe(user);

    expect(findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(compare).toHaveBeenCalledWith("password", "hashed-password");
    expect(loginProtection.clear).toHaveBeenCalledWith("user@example.com");
    expect(loginProtection.recordFailure).not.toHaveBeenCalled();
  });

  it("rejects an invalid password", async () => {
    const user = new User(
      "user-id",
      "user@example.com",
      "hashed-password",
      undefined,
      true,
    );

    findByEmail.mockResolvedValue(user);
    compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: user.email,
        password: "wrong",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(loginProtection.recordFailure).toHaveBeenCalledWith(
      "user@example.com",
    );
    expect(loginProtection.clear).not.toHaveBeenCalled();
  });

  it("rejects login when the account is locked", async () => {
    loginProtection.isLocked.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "password",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(loginProtection.isLocked).toHaveBeenCalledWith("user@example.com");
    expect(findByEmail).not.toHaveBeenCalled();
    expect(compare).not.toHaveBeenCalled();
    expect(loginProtection.recordFailure).not.toHaveBeenCalled();
  });

  it("rejects login when the user does not exist", async () => {
    findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: "missing@example.com",
        password: "password",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(compare).not.toHaveBeenCalled();
    expect(loginProtection.recordFailure).toHaveBeenCalledWith(
      "missing@example.com",
    );
    expect(loginProtection.clear).not.toHaveBeenCalled();
  });

  it("rejects password login when the user has no password", async () => {
    const googleUser = new User(
      "user-id",
      "user@example.com",
      null,
      undefined,
      true,
    );

    findByEmail.mockResolvedValue(googleUser);

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "password",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);

    expect(compare).not.toHaveBeenCalled();
    expect(loginProtection.recordFailure).toHaveBeenCalledWith(
      "user@example.com",
    );
  });

  it("clears previous login failures after successful authentication", async () => {
    const user = new User(
      "user-id",
      "user@example.com",
      "hashed-password",
      undefined,
      true,
    );

    findByEmail.mockResolvedValue(user);
    compare.mockResolvedValue(true);

    await useCase.execute({
      email: " USER@example.com ",
      password: "password",
    });

    expect(loginProtection.clear).toHaveBeenCalledTimes(1);
    expect(loginProtection.clear).toHaveBeenCalledWith("user@example.com");
  });
});
