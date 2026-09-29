import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createClient } from "redis";
import * as Joi from "joi";

import typeormConfig from "./config/typeorm.config";

import { UserOrmEntity } from "./database/orm-entities/user.orm-entity";
import { AuditLogOrmEntity } from "./database/orm-entities/audit-log.orm-entity";
import { UserBalanceOrmEntity } from "./database/orm-entities/user-balance.orm-entity";
import { LedgerOrmEntity } from "./database/orm-entities/ledger.orm-entity";
import { DepositOrmEntity } from "./database/orm-entities/deposit.orm-entity";
import { WithdrawalOrmEntity } from "./database/orm-entities/withdrawal.orm-entity";
import { TicketOrmEntity } from "./database/orm-entities/ticket.orm-entity";
import { TicketMessageOrmEntity } from "./database/orm-entities/ticket-message.orm-entity";
import { TicketCategoryOrmEntity } from "./database/orm-entities/ticket-category.orm-entity";

import { UserRepositoryImpl } from "./database/repositories/user.repository.impl";
import { AuditLogRepositoryImpl } from "./database/repositories/audit-log.repository.impl";
import { UserBalanceRepositoryImpl } from "./database/repositories/user-balance.repository.impl";
import { LedgerRepositoryImpl } from "./database/repositories/ledger.repository.impl";
import { DepositRepositoryImpl } from "./database/repositories/deposit.repository.impl";
import { WithdrawalRepositoryImpl } from "./database/repositories/withdrawal.repository.impl";
import { TicketRepositoryImpl } from "./database/repositories/ticket.repository.impl";
import { TicketMessageRepositoryImpl } from "./database/repositories/ticket-message.repository.impl";
import { TicketCategoryRepositoryImpl } from "./database/repositories/ticket-category.repository.impl";

import { UserRepository } from "@domain/repositories/user.repository";
import { AuditLogRepository } from "@domain/repositories/audit-log.repository";
import { UserBalanceRepository } from "@domain/repositories/user-balance.repository";
import { LedgerRepository } from "@domain/repositories/ledger.repository";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { TicketMessageRepository } from "@domain/repositories/ticket-message.repository";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";

import { BcryptPasswordHasher } from "./services/bcrypt-password-hasher.service";
import { PasswordHasher } from "@application/interfaces/password-hasher.interface";

import { OtpServiceImpl } from "./services/otp.service.impl";
import { RedisOtpStore } from "./services/redis-otp.store";
import { OtpService } from "@application/interfaces/otp.service.interface";

import { GoogleStrategy } from "./auth/google.strategy";
import { SessionSerializer } from "./auth/session.serializer";

import { SeedAdminService } from "./database/seed-admin.service";

import { RedisLoginProtectionService } from "./services/redis-login-protection.service";
import { LoginProtection } from "@application/interfaces/login-protection.interface";

import { NotificationService } from "@application/interfaces/notification.service.interface";
import { SmtpNotificationService } from "./services/notification.service";

import { RedisClientLifecycle } from "./services/redis-client.lifecycle";

import { MinioService } from "./services/minio.service";
import { FileStorage } from "@application/interfaces/file-storage.interface";

import { ImageProcessingService } from "./services/image-processing.service";
import { ImageProcessing } from "@application/interfaces/image-processing.interface";

import { AdminStatisticsServiceImpl } from "./services/admin-statistics.service";
import { AdminStatisticsService } from "@application/interfaces/admin-statistics.interface";

import { TypeOrmUnitOfWork } from "./database/unit-of-work.typeorm";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { FakePaymentProvider } from "./services/fake-payment-provider.service";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_RESOLVER,
} from "@application/interfaces/payment-provider-resolver.interface";
import { PaymentProviderResolverService } from "./services/payment-provider-resolver.service";
import { PaymentProviderInterface } from "@application/interfaces/payment-provider.interface";

import { RedisSessionManager } from "./services/redis-session-manager.service";
import { SessionManager } from "@application/interfaces/session-manager.interface";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { EnvironmentConfig } from "./config/environment.config";

/**
 * Infrastructure composition root.
 *
 * This is the boundary where application/domain abstractions are connected
 * to concrete infrastructure implementations such as TypeORM, Redis,
 * SMTP, MinIO and bcrypt.
 *
 * Environment validation also lives here so the application fails fast
 * during startup instead of discovering a missing configuration later.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],

      validationSchema: Joi.object({
        // -------------------------------------------------------------------
        // Application
        // -------------------------------------------------------------------

        NODE_ENV: Joi.string()
          .valid("development", "test", "production")
          .default("development"),

        PORT: Joi.number().port().default(3000),

        TRUST_PROXY: Joi.number().integer().min(0).default(1),

        FRONTEND_URL: Joi.string().uri().default("http://localhost:8080"),

        SWAGGER_ENABLED: Joi.boolean()
          .truthy("true")
          .falsy("false")
          .default(false),

        DEFAULT_CURRENCY: Joi.string()
          .valid(...Object.values(PaymentCurrency))
          .default(PaymentCurrency.USD),

        // -------------------------------------------------------------------
        // PostgreSQL
        // -------------------------------------------------------------------

        DB_HOST: Joi.string().required(),

        DB_PORT: Joi.number().port().default(5432),

        DB_USERNAME: Joi.string().required(),

        DB_PASSWORD: Joi.string().required(),

        DB_NAME: Joi.string().required(),

        // -------------------------------------------------------------------
        // Redis
        // -------------------------------------------------------------------

        REDIS_HOST: Joi.string().required(),

        REDIS_PORT: Joi.number().port().default(6379),

        REDIS_PASSWORD: Joi.string().allow("").default(""),

        // -------------------------------------------------------------------
        // OTP / authentication protection
        // -------------------------------------------------------------------

        OTP_EXPIRY_SECONDS: Joi.number()
          .integer()
          .min(60)
          .max(900)
          .default(300),

        OTP_MAX_ATTEMPTS: Joi.number().integer().min(1).max(10).default(5),

        OTP_RESEND_COOLDOWN_SECONDS: Joi.number().integer().min(1).default(60),

        OTP_LOG_CODE: Joi.boolean()
          .truthy("true")
          .falsy("false")
          .default(false),

        LOGIN_MAX_ATTEMPTS: Joi.number().integer().min(1).default(5),

        LOGIN_ATTEMPT_WINDOW_SECONDS: Joi.number()
          .integer()
          .min(60)
          .default(900),

        LOGIN_LOCK_SECONDS: Joi.number().integer().min(60).default(900),

        // -------------------------------------------------------------------
        // SMTP
        // -------------------------------------------------------------------

        SMTP_HOST: Joi.string().required(),

        SMTP_PORT: Joi.number().port().default(587),

        SMTP_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),

        SMTP_USER: Joi.string().required(),

        SMTP_PASSWORD: Joi.string().required(),

        SMTP_FROM: Joi.string().email().required(),

        // -------------------------------------------------------------------
        // Sessions
        // -------------------------------------------------------------------

        SESSION_SECRET: Joi.string().min(32).required(),

        // -------------------------------------------------------------------
        // Initial administrator
        //
        // Empty values are intentionally allowed because seeding an initial
        // admin is optional during development.
        // -------------------------------------------------------------------

        INITIAL_ADMIN_EMAIL: Joi.string().email().allow("").default(""),

        INITIAL_ADMIN_PASSWORD: Joi.string().min(12).allow("").default(""),

        // -------------------------------------------------------------------
        // Google OAuth
        // -------------------------------------------------------------------

        GOOGLE_CLIENT_ID: Joi.string().required(),

        GOOGLE_CLIENT_SECRET: Joi.string().required(),

        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

        // -------------------------------------------------------------------
        // MinIO
        // -------------------------------------------------------------------

        MINIO_ENDPOINT: Joi.string().required(),

        MINIO_PORT: Joi.number().port().default(9000),

        MINIO_ACCESS_KEY: Joi.string().required(),

        MINIO_SECRET_KEY: Joi.string().required(),

        MINIO_BUCKET: Joi.string().required(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      useFactory: () => typeormConfig(),
    }),

    TypeOrmModule.forFeature([
      UserOrmEntity,
      AuditLogOrmEntity,
      UserBalanceOrmEntity,
      LedgerOrmEntity,
      DepositOrmEntity,
      WithdrawalOrmEntity,
      TicketOrmEntity,
      TicketMessageOrmEntity,
      TicketCategoryOrmEntity,
    ]),
  ],

  providers: [
    {
      provide: "REDIS_CLIENT",
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<EnvironmentConfig>) => {
        const client = createClient({
          socket: {
            host: configService.getOrThrow("REDIS_HOST"),
            port: configService.getOrThrow("REDIS_PORT"),
          },
          password: configService.get("REDIS_PASSWORD") || undefined,
        });

        await client.connect();

        return client;
      },
    },

    RedisClientLifecycle,

    {
      provide: UserRepository,
      useClass: UserRepositoryImpl,
    },

    {
      provide: PasswordHasher,
      useClass: BcryptPasswordHasher,
    },

    RedisOtpStore,

    RedisLoginProtectionService,

    {
      provide: LoginProtection,
      useExisting: RedisLoginProtectionService,
    },

    SmtpNotificationService,

    {
      provide: NotificationService,
      useExisting: SmtpNotificationService,
    },

    {
      provide: OtpService,
      useClass: OtpServiceImpl,
    },

    SeedAdminService,

    GoogleStrategy,

    SessionSerializer,

    MinioService,

    {
      provide: FileStorage,
      useExisting: MinioService,
    },

    ImageProcessingService,

    {
      provide: ImageProcessing,
      useClass: ImageProcessingService,
    },

    AdminStatisticsServiceImpl,

    {
      provide: AdminStatisticsService,
      useExisting: AdminStatisticsServiceImpl,
    },

    {
      provide: AuditLogRepository,
      useClass: AuditLogRepositoryImpl,
    },

    {
      provide: UserBalanceRepository,
      useClass: UserBalanceRepositoryImpl,
    },

    {
      provide: UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },

    {
      provide: LedgerRepository,
      useClass: LedgerRepositoryImpl,
    },

    {
      provide: DepositRepository,
      useClass: DepositRepositoryImpl,
    },

    {
      provide: WithdrawalRepository,
      useClass: WithdrawalRepositoryImpl,
    },

    {
      provide: TicketRepository,
      useClass: TicketRepositoryImpl,
    },

    {
      provide: TicketMessageRepository,
      useClass: TicketMessageRepositoryImpl,
    },

    {
      provide: TicketCategoryRepository,
      useClass: TicketCategoryRepositoryImpl,
    },

    FakePaymentProvider,

    {
      provide: PAYMENT_PROVIDERS,
      inject: [FakePaymentProvider],
      useFactory: (
        fakePaymentProvider: FakePaymentProvider,
      ): PaymentProviderInterface[] => {
        return [fakePaymentProvider];
      },
    },

    {
      provide: PAYMENT_PROVIDER_RESOLVER,
      useClass: PaymentProviderResolverService,
    },
    {
      provide: SessionManager,
      useClass: RedisSessionManager,
    },
  ],

  exports: [
    UserRepository,
    PasswordHasher,
    OtpService,
    LoginProtection,
    NotificationService,
    "REDIS_CLIENT",
    FileStorage,
    ImageProcessing,
    AdminStatisticsService,
    AuditLogRepository,
    UserBalanceRepository,
    UnitOfWork,
    LedgerRepository,
    DepositRepository,
    WithdrawalRepository,
    TicketRepository,
    TicketMessageRepository,
    TicketCategoryRepository,
    PAYMENT_PROVIDER_RESOLVER,
    SessionManager,
  ],
})
export class InfrastructureModule {}
