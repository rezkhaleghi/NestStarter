import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { RedisClientType } from "redis";
import { LoginProtection } from "../../application/interfaces/login-protection.interface";

@Injectable()
export class RedisLoginProtectionService implements LoginProtection {
  private readonly maxAttempts: number;
  private readonly windowSeconds: number;
  private readonly lockSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject("REDIS_CLIENT") private readonly redis: RedisClientType,
  ) {
    this.maxAttempts = Number(
      this.configService.get<string>("LOGIN_MAX_ATTEMPTS", "5"),
    );
    this.windowSeconds = Number(
      this.configService.get<string>("LOGIN_ATTEMPT_WINDOW_SECONDS", "900"),
    );
    this.lockSeconds = Number(
      this.configService.get<string>("LOGIN_LOCK_SECONDS", "900"),
    );
  }

  async isLocked(identifier: string): Promise<boolean> {
    return (await this.redis.exists(this.lockKey(identifier))) === 1;
  }

  async recordFailure(identifier: string): Promise<void> {
    await this.redis.eval(
      "local attempts = redis.call('INCR', KEYS[1]); if attempts == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; if attempts >= tonumber(ARGV[2]) then redis.call('SET', KEYS[2], '1', 'EX', ARGV[3]); end; return attempts;",
      {
        keys: [this.attemptsKey(identifier), this.lockKey(identifier)],
        arguments: [
          String(this.windowSeconds),
          String(this.maxAttempts),
          String(this.lockSeconds),
        ],
      },
    );
  }

  async clear(identifier: string): Promise<void> {
    await this.redis.del([
      this.attemptsKey(identifier),
      this.lockKey(identifier),
    ]);
  }

  private attemptsKey(identifier: string): string {
    return `login-attempts:${identifier.toLowerCase()}`;
  }
  private lockKey(identifier: string): string {
    return `login-locked:${identifier.toLowerCase()}`;
  }
}
