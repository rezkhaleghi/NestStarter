import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createClient } from "redis";
import typeormConfig from "./config/typeorm.config";
import { UserOrmEntity } from "./database/orm-entities/user.orm-entity";
import { UserRepositoryImpl } from "./database/repositories/user.repository.impl";
import { UserRepository } from "../domain/repositories/user.repository";
import { BcryptPasswordHasher } from "./services/bcrypt-password-hasher.service";
import { PasswordHasher } from "../application/interfaces/password-hasher.interface";
import { OtpServiceImpl } from "./services/otp.service.impl";
import { RedisOtpStore } from "./services/redis-otp.store";
import { OtpService } from "../application/interfaces/otp.service.interface";
import { GoogleStrategy } from "./auth/google.strategy";
import { SessionSerializer } from "./auth/session.serializer";
import { SeedAdminService } from "./database/seed-admin.service";
import * as Joi from "joi";
import { RedisLoginProtectionService } from "./services/redis-login-protection.service";
import { LoginProtection } from "../application/interfaces/login-protection.interface";
import { NotificationService } from "../application/interfaces/notification.service.interface";
import { SmtpNotificationService } from "./services/notification.service";
import { RedisClientLifecycle } from "./services/redis-client.lifecycle";
import { MinioService } from "./services/minio.service";
import { FileStorage } from "../application/interfaces/file-storage.interface";
import { ImageProcessingService } from "./services/image-processing.service";
import { ImageProcessing } from "@application/interfaces/image-processing.interface";
/**
 * This module is the ONLY place where abstract tokens (interfaces) from
 * domain/application get bound to concrete infrastructure implementations.
 * Everything above (application, api) stays unaware of TypeORM, bcrypt, etc.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "test", "production")
          .default("development"),
        PORT: Joi.number().port().default(3000),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().port().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().port().default(6379),
        REDIS_PASSWORD: Joi.string().allow(""),
        OTP_EXPIRY_SECONDS: Joi.number()
          .integer()
          .min(60)
          .max(900)
          .default(300),
        OTP_MAX_ATTEMPTS: Joi.number().integer().min(1).max(10).default(5),
        OTP_RESEND_COOLDOWN_SECONDS: Joi.number().integer().min(1).default(60),
        LOGIN_MAX_ATTEMPTS: Joi.number().integer().min(1).default(5),
        LOGIN_ATTEMPT_WINDOW_SECONDS: Joi.number()
          .integer()
          .min(60)
          .default(900),
        LOGIN_LOCK_SECONDS: Joi.number().integer().min(60).default(900),
        OTP_LOG_CODE: Joi.boolean()
          .truthy("true")
          .falsy("false")
          .default(false),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().port().default(587),
        SMTP_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),
        SMTP_USER: Joi.string().required(),
        SMTP_PASSWORD: Joi.string().required(),
        SMTP_FROM: Joi.string().email().required(),
        SESSION_SECRET: Joi.string().min(32).required(),
        INITIAL_ADMIN_EMAIL: Joi.string().email().allow(""),
        INITIAL_ADMIN_PASSWORD: Joi.string().min(12).allow(""),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
        FRONTEND_URL: Joi.string().uri().default("http://localhost:3000"),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => typeormConfig(),
    }),
    TypeOrmModule.forFeature([UserOrmEntity]),
  ],
  providers: [
    {
      provide: "REDIS_CLIENT",
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          socket: {
            host: configService.get<string>("REDIS_HOST", "localhost"),
            port: Number(configService.get<string>("REDIS_PORT", "6379")),
          },
          password: configService.get<string>("REDIS_PASSWORD") || undefined,
        });
        await client.connect();
        return client;
      },
    },
    RedisClientLifecycle,
    { provide: UserRepository, useClass: UserRepositoryImpl },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    RedisOtpStore,
    RedisLoginProtectionService,
    { provide: LoginProtection, useExisting: RedisLoginProtectionService },
    SmtpNotificationService,
    { provide: NotificationService, useExisting: SmtpNotificationService },
    { provide: OtpService, useClass: OtpServiceImpl },
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
  ],
})
export class InfrastructureModule {}
