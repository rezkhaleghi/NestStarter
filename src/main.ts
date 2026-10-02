import { HttpExceptionFilter } from "./api/http-exception.filter";
import { randomUUID } from "crypto";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import session = require("express-session");
import * as passport from "passport";
import { RedisStore } from "connect-redis";
import type { RedisClientType } from "redis";
import type { Request, Response } from "express";
import { AppModule } from "./app.module";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

/**
 * Application bootstrap function.
 *
 * Creates the NestJS application, configures global middleware,
 * authentication, sessions, Swagger, and finally starts the HTTP server.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("HTTP");

  // Access environment configuration.
  const configService = app.get(ConfigService<EnvironmentConfig>);

  // Close resources (eg. db, redis) when the app receives SIGTERM or SIGINT.
  app.enableShutdownHooks();

  // Tell Express to trust the first proxy when running behind a reverse proxy/load balancer in prod.
  // (eg. detecting HTTPS correctly, secure cookies, client IP handling)
  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", configService.get("TRUST_PROXY", 1));

  // Enables CORS.
  app.enableCors({
    origin: configService.getOrThrow("FRONTEND_URL"),
    credentials: true,
  });

  // Helmet helps set appropriate security-related response headers.
  app.use(helmet());

  /**
   * Adds a correlation ID to each request and response for tracing.
   *
   * We generate the ID server-side rather than trusting a client-supplied
   * value, so clients cannot inject arbitrary values into our logs.
   */
  app.use((request: Request, response: Response, next: () => void) => {
    const requestId = randomUUID();

    response.setHeader("X-Request-Id", requestId);

    (request as Request & { requestId: string }).requestId = requestId;

    next();
  });

  /**
   * Logs completed HTTP requests.
   *
   * Only operational metadata is logged:
   * - method
   * - path (without query parameters)
   * - status code
   * - duration
   * - request ID
   *
   * We intentionally do not log request bodies, cookies, authorization
   * headers, or query strings because they may contain credentials,
   * tokens, OTPs, or other sensitive user data.
   *
   * The 5xx exception details themselves are logged by HttpExceptionFilter.
   */
  app.use((request: Request, response: Response, next: () => void) => {
    const startedAt = process.hrtime.bigint();
    const requestId =
      (request as Request & { requestId?: string }).requestId ?? "unknown";

    response.on("finish", () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      logger.log(
        `${request.method} ${request.path} ${response.statusCode} ${durationMs.toFixed(1)}ms requestId=${requestId}`,
      );
    });

    next();
  });

  // Enable global DTO validation.
  // This means every controller using DTO validation automatically gets the same validation behavior.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // HTTP/application exceptions convert into consistent HTTP responses.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Retrieve the Redis client registered by AppModule.
  const redisClient = app.get<RedisClientType>("REDIS_CLIENT");

  // Get the secret used to sign/encrypt session information.
  // The app fails if SESSION_SECRET is not set in the environment.
  const sessionSecret = configService.getOrThrow("SESSION_SECRET");

  // Configure Express server-side sessions.
  app.use(
    session({
      secret: sessionSecret,
      store: new RedisStore({
        client: redisClient,
        prefix: "session:",
      }),
      resave: false,
      saveUninitialized: false,

      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: configService.get("NODE_ENV") === "production",
        maxAge: 1000 * 60 * 60 * 24,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Swagger/OpenAPI documentation setup.
  const swaggerEnabled = configService.get("SWAGGER_ENABLED");

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle("API")
      .setDescription("Auto-generated API documentation")
      .setVersion("1.0")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(configService.get("PORT", 3000));
}

bootstrap();
