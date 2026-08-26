import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { OtpServiceImpl } from "./otp.service.impl";

describe("OtpServiceImpl", () => {
  const config = {
    get: jest.fn((key: string, fallback: string) => fallback),
  };
  const otpStore = {
    save: jest.fn<() => Promise<void>>(),
    verify: jest.fn<() => Promise<boolean>>(),
    delete: jest.fn<() => Promise<void>>(),
  };
  const notificationService = {
    sendOtp: jest.fn<() => Promise<void>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string, fallback: string) => fallback);
  });

  it("normalizes the email, stores the OTP, and sends it", async () => {
    notificationService.sendOtp.mockResolvedValue();
    const service = new OtpServiceImpl(
      config as any,
      otpStore as any,
      notificationService as any,
    );

    await service.generateAndSend(" USER@example.com ");

    expect(otpStore.save).toHaveBeenCalledWith(
      "user@example.com",
      expect.stringMatching(/^\d{6}$/),
    );
    expect(notificationService.sendOtp).toHaveBeenCalledWith(
      "user@example.com",
      expect.stringMatching(/^\d{6}$/),
      300,
    );
  });

  it("deletes the OTP when delivery fails outside development logging mode", async () => {
    const error = new Error("delivery failed");
    notificationService.sendOtp.mockRejectedValue(error);
    const service = new OtpServiceImpl(
      config as any,
      otpStore as any,
      notificationService as any,
    );

    await expect(service.generateAndSend("user@example.com")).rejects.toBe(
      error,
    );
    expect(otpStore.delete).toHaveBeenCalledWith("user@example.com");
  });

  it("keeps the OTP when development logging is enabled", async () => {
    config.get.mockImplementation((key: string, fallback: string) =>
      key === "OTP_LOG_CODE" ? "true" : fallback,
    );
    notificationService.sendOtp.mockRejectedValue(new Error("delivery failed"));
    const service = new OtpServiceImpl(
      config as any,
      otpStore as any,
      notificationService as any,
    );

    await expect(
      service.generateAndSend("user@example.com"),
    ).resolves.toBeUndefined();
    expect(otpStore.delete).not.toHaveBeenCalled();
  });

  it("delegates OTP verification", async () => {
    otpStore.verify.mockResolvedValue(true);
    const service = new OtpServiceImpl(
      config as any,
      otpStore as any,
      notificationService as any,
    );
    await expect(service.verify("USER@example.com", "123456")).resolves.toBe(
      true,
    );
    expect(otpStore.verify).toHaveBeenCalledWith("USER@example.com", "123456");
  });
});
