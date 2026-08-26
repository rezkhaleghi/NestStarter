import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import type { RedisClientType } from "redis";

@Injectable()
export class RedisClientLifecycle implements OnApplicationShutdown {
  constructor(
    @Inject("REDIS_CLIENT") private readonly redis: RedisClientType,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.redis.isOpen) {
      await this.redis.quit();
    }
  }
}
