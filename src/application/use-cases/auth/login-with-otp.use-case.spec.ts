import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { InvalidOtpException } from "../../../domain/exceptions/domain.exception";
import { LoginWithOtpUseCase } from "./login-with-otp.use-case";

describe("LoginWithOtpUseCase", () => {
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
    const user = new User(
      "user-id",
      "user@example.com",
      "hashed-password",
      undefined,
      true,
    );

    findByEmail.mockResolvedValue(user);
    verify.mockResolvedValue(true);

    await expect(useCase.execute(" USER@example.com ", "123456")).resolves.toBe(
      user,
    );

    expect(findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(verify).toHaveBeenCalledWith("user@example.com", "123456");
    expect(save).not.toHaveBeenCalled();
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

    await expect(useCase.execute(unverifiedUser.email, "123456")).resolves.toBe(
      unverifiedUser,
    );

    expect(unverifiedUser.emailVerified).toBe(true);
    expect(save).toHaveBeenCalledWith(unverifiedUser);
  });

  it("does not save an already verified user", async () => {
    const verifiedUser = new User(
      "user-id",
      "user@example.com",
      "hashed-password",
      undefined,
      true,
    );

    findByEmail.mockResolvedValue(verifiedUser);
    verify.mockResolvedValue(true);

    await expect(useCase.execute(verifiedUser.email, "123456")).resolves.toBe(
      verifiedUser,
    );

    expect(verifiedUser.emailVerified).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it("rejects an invalid OTP", async () => {
    const user = new User(
      "user-id",
      "user@example.com",
      "hashed-password",
      undefined,
      true,
    );

    findByEmail.mockResolvedValue(user);
    verify.mockResolvedValue(false);

    await expect(useCase.execute(user.email, "wrong")).rejects.toBeInstanceOf(
      InvalidOtpException,
    );

    expect(save).not.toHaveBeenCalled();
  });

  it("does not verify or save the user when the user does not exist", async () => {
    findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute("missing@example.com", "123456"),
    ).rejects.toThrow();

    expect(verify).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
