import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { InvalidOtpException } from "../../../domain/exceptions/domain.exception";
import { VerifyOtpUseCase } from "./verify-otp.use-case";

describe("VerifyOtpUseCase", () => {
  const verify = jest.fn<(email: string, otp: string) => Promise<boolean>>();
  const useCase = new VerifyOtpUseCase({ verify } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts a valid OTP", async () => {
    verify.mockResolvedValue(true);
    await expect(
      useCase.execute({ email: "USER@example.com", otp: "123456" }),
    ).resolves.toBeUndefined();
    expect(verify).toHaveBeenCalledWith("USER@example.com", "123456");
  });

  it("rejects an invalid OTP", async () => {
    verify.mockResolvedValue(false);
    await expect(
      useCase.execute({ email: "user@example.com", otp: "wrong" }),
    ).rejects.toBeInstanceOf(InvalidOtpException);
  });
});
