import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import type { RedisClientType } from "redis";
import { OtpCooldownException } from "../../domain/exceptions/domain.exception";

@Injectable()
export class RedisOtpStore {
  private readonly expirySeconds: number;
  private readonly maxAttempts: number;
  private readonly resendCooldownSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject("REDIS_CLIENT") private readonly redis: RedisClientType,
  ) {
    this.expirySeconds = Number(
      this.configService.get<string>("OTP_EXPIRY_SECONDS", "300"),
    );
    this.maxAttempts = Number(
      this.configService.get<string>("OTP_MAX_ATTEMPTS", "5"),
    );
    this.resendCooldownSeconds = Number(
      this.configService.get<string>("OTP_RESEND_COOLDOWN_SECONDS", "60"),
    );
  }

  async save(email: string, otp: string): Promise<void> {
    const result = await this.redis.eval(
      "if redis.call('SET', KEYS[1], '1', 'EX', ARGV[1], 'NX') == false then return 0; end; redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3]); redis.call('DEL', KEYS[3]); return 1;",
      {
        keys: [
          this.cooldownKeyFor(email),
          this.keyFor(email),
          this.attemptsKeyFor(email),
        ],
        arguments: [
          String(this.resendCooldownSeconds),
          this.hash(otp),
          String(this.expirySeconds),
        ],
      },
    );
    if (Number(result) !== 1) {
      throw new OtpCooldownException();
    }
  }

  async verify(email: string, otp: string): Promise<boolean> {
    const result = await this.redis.eval(
      "local attempts = redis.call('INCR', KEYS[2]); if attempts == 1 then redis.call('EXPIRE', KEYS[2], ARGV[2]); end; if attempts > tonumber(ARGV[3]) then return 0; end; local value = redis.call('GET', KEYS[1]); if value == ARGV[1] then redis.call('DEL', KEYS[1]); redis.call('DEL', KEYS[2]); return 1; end; return 0;",
      {
        keys: [this.keyFor(email), this.attemptsKeyFor(email)],
        arguments: [
          this.hash(otp),
          String(this.expirySeconds),
          String(this.maxAttempts),
        ],
      },
    );
    return Number(result) === 1;
  }

  async delete(email: string): Promise<void> {
    await this.redis.del([
      this.keyFor(email),
      this.attemptsKeyFor(email),
      this.cooldownKeyFor(email),
    ]);
  }

  private keyFor(email: string): string {
    return `otp:${email.toLowerCase()}`;
  }

  private attemptsKeyFor(email: string): string {
    return `otp-attempts:${email.toLowerCase()}`;
  }

  private cooldownKeyFor(email: string): string {
    return `otp-cooldown:${email.toLowerCase()}`;
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}
