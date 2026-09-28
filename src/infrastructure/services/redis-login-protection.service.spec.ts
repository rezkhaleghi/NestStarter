import { createHash } from "crypto";

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

  const clientIp = "203.0.113.10";

  const scopeHash = (email: string, ip: string): string =>
    createHash("sha256").update(`${email.toLowerCase()}\n${ip}`).digest("hex");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("checks whether an account/IP scope is locked", async () => {
    const hash = scopeHash("USER@example.com", clientIp);

    redis.exists.mockResolvedValue(1);

    await expect(service.isLocked("USER@example.com", clientIp)).resolves.toBe(
      true,
    );

    expect(redis.exists).toHaveBeenCalledWith(`login-locked:${hash}`);

    redis.exists.mockResolvedValue(0);

    await expect(service.isLocked("user@example.com", clientIp)).resolves.toBe(
      false,
    );
  });

  it("records a failure with the configured Redis script", async () => {
    const hash = scopeHash("USER@example.com", clientIp);

    redis.eval.mockResolvedValue(1);

    await service.recordFailure("USER@example.com", clientIp);

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("INCR"),
      expect.objectContaining({
        keys: [`login-attempts:${hash}`, `login-locked:${hash}`],
      }),
    );
  });

  it("clears attempts and lock keys", async () => {
    const hash = scopeHash("USER@example.com", clientIp);

    redis.del.mockResolvedValue(2);

    await service.clear("USER@example.com", clientIp);

    expect(redis.del).toHaveBeenCalledWith([
      `login-attempts:${hash}`,
      `login-locked:${hash}`,
    ]);
  });

  it("uses different Redis scopes for different client IPs", async () => {
    const firstHash = scopeHash("user@example.com", "203.0.113.10");
    const secondHash = scopeHash("user@example.com", "203.0.113.11");

    expect(firstHash).not.toBe(secondHash);
  });
});
