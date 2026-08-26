import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RedisOtpStore } from "./redis-otp.store";
import { OtpCooldownException } from "../../domain/exceptions/domain.exception";

describe("RedisOtpStore", () => {
  const redis = {
    eval: jest.fn<() => Promise<number>>(),
    del: jest.fn<() => Promise<number>>(),
  };
  const config = {
    get: jest.fn((key: string, fallback: string) => fallback),
  };
  const store = new RedisOtpStore(config as any, redis as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("atomically saves cooldown, OTP, and resets attempts", async () => {
    redis.eval.mockResolvedValue(1);
    await store.save("USER@example.com", "123456");

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('SET', KEYS[1]"),
      expect.objectContaining({
        keys: [
          "otp-cooldown:user@example.com",
          "otp:user@example.com",
          "otp-attempts:user@example.com",
        ],
      }),
    );
  });

  it("rejects a request during the resend cooldown", async () => {
    redis.eval.mockResolvedValue(0);
    await expect(
      store.save("user@example.com", "123456"),
    ).rejects.toBeInstanceOf(OtpCooldownException);
  });

  it("returns true only when Redis verifies the OTP", async () => {
    redis.eval.mockResolvedValue(1);
    await expect(store.verify("user@example.com", "123456")).resolves.toBe(
      true,
    );
    redis.eval.mockResolvedValue(0);
    await expect(store.verify("user@example.com", "wrong")).resolves.toBe(
      false,
    );
  });

  it("deletes all OTP-related keys", async () => {
    redis.del.mockResolvedValue(3);
    await store.delete("USER@example.com");
    expect(redis.del).toHaveBeenCalledWith([
      "otp:user@example.com",
      "otp-attempts:user@example.com",
      "otp-cooldown:user@example.com",
    ]);
  });
});
