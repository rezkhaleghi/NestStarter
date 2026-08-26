import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RedisLoginProtectionService } from "./redis-login-protection.service";

describe("RedisLoginProtectionService", () => {
  const redis = {
    exists: jest.fn<() => Promise<number>>(),
    eval: jest.fn<() => Promise<number>>(),
    del: jest.fn<() => Promise<number>>(),
  };
  const config = {
    get: jest.fn((key: string, fallback: string) => fallback),
  };
  const service = new RedisLoginProtectionService(config as any, redis as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("checks whether an account is locked", async () => {
    redis.exists.mockResolvedValue(1);
    await expect(service.isLocked("USER@example.com")).resolves.toBe(true);
    expect(redis.exists).toHaveBeenCalledWith("login-locked:user@example.com");
    redis.exists.mockResolvedValue(0);
    await expect(service.isLocked("user@example.com")).resolves.toBe(false);
  });

  it("records a failure with the configured Redis script", async () => {
    redis.eval.mockResolvedValue(1);
    await service.recordFailure("USER@example.com");
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("INCR"),
      expect.objectContaining({
        keys: [
          "login-attempts:user@example.com",
          "login-locked:user@example.com",
        ],
      }),
    );
  });

  it("clears attempts and lock keys", async () => {
    redis.del.mockResolvedValue(2);
    await service.clear("USER@example.com");
    expect(redis.del).toHaveBeenCalledWith([
      "login-attempts:user@example.com",
      "login-locked:user@example.com",
    ]);
  });
});
