import { Controller, Get, Inject } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import type { RedisClientType } from "redis";

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    @Inject("REDIS_CLIENT") private readonly redis: RedisClientType,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.database.pingCheck("database"),
      async () => {
        await this.redis.ping();
        return { redis: { status: "up" } };
      },
    ]);
  }
}
