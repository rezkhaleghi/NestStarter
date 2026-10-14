import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AdminModule } from "./api/admin/admin.module";
import { AuthModule } from "./api/auth/auth.module";
import { DepositsModule } from "./api/deposits/deposits.module";
import { FilesModule } from "./api/files/files.module";
import { HealthModule } from "./api/health/health.module";
import { TicketsModule } from "./api/tickets/tickets.module";
import { UsersModule } from "./api/users/users.module";
import { WithdrawalsModule } from "./api/withdrawals/withdrawals.module";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
} from "nestjs-i18n";
import * as path from "path";
import { PagesModule } from "@api/pages/pages.module";

/**
 * Root application module.
 *
 * AppModule is the composition root of the NestJS application.
 * It connects the API modules with the shared infrastructure and
 * global framework-level configuration.
 */
@Module({
  imports: [
    /**
     * Global API rate limiting.
     *
     * 60 requests per 60 seconds per client.
     *
     * The guard below makes this policy apply automatically to
     * controllers throughout the application.
     */
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: path.join(__dirname, "i18n"),
        watch: process.env.NODE_ENV !== "production",
      },
      resolvers: [new HeaderResolver(["x-lang"]), AcceptLanguageResolver],
    }),

    /**
     * Infrastructure contains concrete implementations for things
     * such as persistence, Redis, authentication services, storage,
     * and other external dependencies.
     */
    InfrastructureModule,

    // Authentication and authorization.
    AuthModule,
    AdminModule,

    // User-facing API modules.
    UsersModule,
    FilesModule,
    TicketsModule,

    // Financial API modules.
    DepositsModule,
    WithdrawalsModule,

    // Operational endpoints such as health checks.
    HealthModule,

    PagesModule,
  ],

  /**
   * Register rate limiting globally instead of requiring every
   * controller to explicitly use @UseGuards(ThrottlerGuard).
   */
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
