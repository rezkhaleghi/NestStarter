import { Controller, Get, Inject } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import type { RedisClientType } from "redis";
import { FileStorage } from "../../application/interfaces/file-storage.interface";

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    private readonly fileStorage: FileStorage,
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
      async () => {
        await this.fileStorage.healthCheck();
        return { minio: { status: "up" } };
      },
    ]);
  }
}
