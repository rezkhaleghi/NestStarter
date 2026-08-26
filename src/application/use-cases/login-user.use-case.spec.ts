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
    "user@example.com",
    "hashed-password",
    UserRole.USER,
  );
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const compare =
    jest.fn<(plain: string, hashed: string) => Promise<boolean>>();
  const verify = jest.fn<(email: string, otp: string) => Promise<boolean>>();
  const repository = {
    findByEmail,
  };
  const passwordHasher = {
    compare,
  };
  const otpService = {
    verify,
  };
  const useCase = new LoginUserUseCase(
    repository as any,
    passwordHasher as any,
    otpService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authenticates a password user", async () => {
    repository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);

    await expect(
      useCase.loginEmail({ email: " USER@example.com ", password: "password" }),
    ).resolves.toBe(user);
    expect(repository.findByEmail).toHaveBeenCalledWith("user@example.com");
  });

  it("rejects an invalid password", async () => {
    repository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.loginEmail({ email: "user@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it("authenticates an OTP user and delegates single-use verification", async () => {
    repository.findByEmail.mockResolvedValue(user);
    otpService.verify.mockResolvedValue(true);

    await expect(
      useCase.loginOtp(" USER@example.com ", "123456"),
    ).resolves.toBe(user);
    expect(otpService.verify).toHaveBeenCalledWith(
      "user@example.com",
      "123456",
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
