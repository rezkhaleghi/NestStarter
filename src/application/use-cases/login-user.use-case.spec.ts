import { UserRole } from "../../domain/enums/user-role.enum";
import {
  InvalidCredentialsException,
  InvalidOtpException,
} from "../../domain/exceptions/domain.exception";
import { User } from "../../domain/entities/user.entity";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { LoginUserUseCase } from "./login-user.use-case";

describe("LoginUserUseCase", () => {
  const user = new User(
    "user-id",
    "user@gmail.com",
    "hashed-password",
    UserRole.USER,
    true,
  );
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const save = jest.fn<(user: User) => Promise<User>>();
  const compare =
    jest.fn<(plain: string, hashed: string) => Promise<boolean>>();
  const verify = jest.fn<(email: string, otp: string) => Promise<boolean>>();
  const repository = {
    findByEmail,
    save,
  };
  const passwordHasher = {
    compare,
  };
  const otpService = {
    verify,
  };
  const loginProtection = {
    isLocked: jest.fn<() => Promise<boolean>>(),
    recordFailure: jest.fn<() => Promise<void>>(),
    clear: jest.fn<() => Promise<void>>(),
  };
  const useCase = new LoginUserUseCase(
    repository as any,
    passwordHasher as any,
    otpService as any,
    loginProtection as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    loginProtection.isLocked.mockResolvedValue(false);
  });

  it("authenticates a password user", async () => {
    repository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);

    await expect(
      useCase.loginPassword({
        email: " USER@gmail.com ",
        password: "password",
      }),
    ).resolves.toBe(user);
    expect(repository.findByEmail).toHaveBeenCalledWith("user@gmail.com");
  });

  it("rejects an invalid password", async () => {
    repository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.loginPassword({ email: "user@gmail.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it("authenticates an OTP user and delegates single-use verification", async () => {
    repository.findByEmail.mockResolvedValue(user);
    otpService.verify.mockResolvedValue(true);

    await expect(useCase.loginOtp(" USER@gmail.com ", "123456")).resolves.toBe(
      user,
    );
    expect(otpService.verify).toHaveBeenCalledWith("user@gmail.com", "123456");
  });

  it("verifies an unverified user after a valid OTP", async () => {
    const unverifiedUser = new User(
      user.id,
      user.email,
      user.hashedPassword,
      user.role,
      false,
    );
    const verifiedUser = new User(
      user.id,
      user.email,
      user.hashedPassword,
      user.role,
      true,
    );
    repository.findByEmail.mockResolvedValue(unverifiedUser);
    otpService.verify.mockResolvedValue(true);
    repository.save.mockResolvedValue(verifiedUser);

    await expect(useCase.loginOtp(user.email, "123456")).resolves.toBe(
      unverifiedUser,
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ emailVerified: true }),
    );
  });

  it("rejects an invalid OTP", async () => {
    repository.findByEmail.mockResolvedValue(user);
    otpService.verify.mockResolvedValue(false);

    await expect(useCase.loginOtp(user.email, "wrong")).rejects.toBeInstanceOf(
      InvalidOtpException,
    );
  });
});
