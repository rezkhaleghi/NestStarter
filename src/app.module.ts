import { Module } from "@nestjs/common";
import { AuthModule } from "./api/auth/auth.module";
import { AdminModule } from "./api/admin/admin.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { HealthModule } from "./api/health/health.module";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { UsersModule } from "./api/users/users.module";

/**
 * Root application module.
 *
 * AppModule is the entry point of the NestJS dependency-injection
 * module tree. Other modules are imported here and NestJS uses
 * this module to build the application.
 */
@Module({
  imports: [
    // Configure global API rate limiting.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]), // 60 requests / 60 seconds / client
    InfrastructureModule, // Shared application infrastructure.
    AuthModule,
    AdminModule,
    HealthModule,
    UsersModule,
  ],

  // Register ThrottlerGuard as a global guard.
  // Because of this, individual controllers don't need: @UseGuards(ThrottlerGuard) on every endpoint.
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
