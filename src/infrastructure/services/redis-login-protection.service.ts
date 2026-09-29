import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import type { RedisClientType } from "redis";

import { LoginProtection } from "@application/interfaces/login-protection.interface";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

/**
 * Redis-backed password-login protection.
 *
 * Failed attempts are scoped to BOTH the account and client IP:
 *
 *   email + IP
 *
 * This is important because an email-only lock would allow anyone who knows
 * another user's email address to deliberately lock that account.
 *
 * The global Nest throttler still provides broader request/IP protection.
 */
@Injectable()
export class RedisLoginProtectionService implements LoginProtection {
  private readonly maxAttempts: number;
  private readonly windowSeconds: number;
  private readonly lockSeconds: number;

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
    @Inject("REDIS_CLIENT") private readonly redis: RedisClientType,
  ) {
    this.maxAttempts = this.configService.get("LOGIN_MAX_ATTEMPTS", 5);

    this.windowSeconds = this.configService.get(
      "LOGIN_ATTEMPT_WINDOW_SECONDS",
      900,
    );

    this.lockSeconds = this.configService.get("LOGIN_LOCK_SECONDS", 900);
  }

  async isLocked(email: string, clientIp: string): Promise<boolean> {
    return (await this.redis.exists(this.lockKey(email, clientIp))) === 1;
  }

  async recordFailure(email: string, clientIp: string): Promise<void> {
    await this.redis.eval(
      `
      local attempts = redis.call('INCR', KEYS[1]);

      if attempts == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1]);
      end;

      if attempts >= tonumber(ARGV[2]) then
        redis.call('SET', KEYS[2], '1', 'EX', ARGV[3]);
      end;

      return attempts;
      `,
      {
        keys: [
          this.attemptsKey(email, clientIp),
          this.lockKey(email, clientIp),
        ],
        arguments: [
          String(this.windowSeconds),
          String(this.maxAttempts),
          String(this.lockSeconds),
        ],
      },
    );
  }

  async clear(email: string, clientIp: string): Promise<void> {
    await this.redis.del([
      this.attemptsKey(email, clientIp),
      this.lockKey(email, clientIp),
    ]);
  }

  private attemptsKey(email: string, clientIp: string): string {
    return `login-attempts:${this.scopeHash(email, clientIp)}`;
  }

  private lockKey(email: string, clientIp: string): string {
    return `login-locked:${this.scopeHash(email, clientIp)}`;
  }

  /**
   * Hash the composite identifier before putting it into Redis.
   *
   * Besides producing predictable key lengths, this avoids storing raw
   * email addresses and IP addresses directly in Redis key names.
   */
  private scopeHash(email: string, clientIp: string): string {
    return createHash("sha256")
      .update(`${email.toLowerCase()}\n${clientIp}`)
      .digest("hex");
  }
}
