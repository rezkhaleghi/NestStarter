import { Module } from "@nestjs/common";
import { AuthModule } from "./api/auth/auth.module";
import { AdminModule } from "./api/admin/admin.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { HealthModule } from "./api/health/health.module";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    InfrastructureModule,
    AuthModule,
    AdminModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
