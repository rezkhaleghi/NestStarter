import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { InvalidOtpException } from "../../../domain/exceptions/domain.exception";
import { LoginWithOtpUseCase } from "./login-with-otp.use-case";

describe("LoginWithOtpUseCase", () => {
  const user = new User(
    "user-id",
    "user@example.com",
    "hashed-password",
    undefined,
    true,
  );
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const save = jest.fn<(user: User) => Promise<User>>();
  const verify = jest.fn<(email: string, otp: string) => Promise<boolean>>();
  const useCase = new LoginWithOtpUseCase(
    { findByEmail, save } as any,
    { verify } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authenticates with a valid OTP", async () => {
    findByEmail.mockResolvedValue(user);
    verify.mockResolvedValue(true);

    await expect(useCase.execute(" USER@example.com ", "123456")).resolves.toBe(
      user,
    );
    expect(verify).toHaveBeenCalledWith("user@example.com", "123456");
  });

  it("verifies an unverified user after a valid OTP", async () => {
    const unverifiedUser = new User(
      "user-id",
      "user@example.com",
      "hashed-password",
    );
    findByEmail.mockResolvedValue(unverifiedUser);
    verify.mockResolvedValue(true);
    save.mockResolvedValue(unverifiedUser);

    await useCase.execute(unverifiedUser.email, "123456");

    expect(unverifiedUser.emailVerified).toBe(true);
    expect(save).toHaveBeenCalledWith(unverifiedUser);
  });

  it("rejects an invalid OTP", async () => {
    findByEmail.mockResolvedValue(user);
    verify.mockResolvedValue(false);

    await expect(useCase.execute(user.email, "wrong")).rejects.toBeInstanceOf(
      InvalidOtpException,
    );
  });
});
