import { HttpExceptionFilter } from "./api/http-exception.filter";
import { randomUUID } from "crypto";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import session = require("express-session");
import * as passport from "passport";
import { RedisStore } from "connect-redis";
import type { RedisClientType } from "redis";
import type { Request, Response } from "express";
import { AppModule } from "./app.module";

/**
 * Application bootstrap function.
 *
 * Creates the NestJS application, configures global middleware,
 * authentication, sessions, Swagger, and finally starts the HTTP server.
 */
async function bootstrap() {
  // Create the NestJS application from the root AppModule.
  const app = await NestFactory.create(AppModule);

  // Access environment configuration.
  const configService = app.get(ConfigService);

  // Close resources(eg. db,redis) when the app receives SIGTERM or SIGINT.
  app.enableShutdownHooks();

  // Tell Express to trust the first proxy When running behind a reverse proxy/load balancer in prod.
  // (eg. detecting HTTPS correctly, secure cookies, client IP handling)
  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", configService.get<number>("TRUST_PROXY", 1));

  // Enabls CORS.
  app.enableCors({
    origin: configService.getOrThrow<string>("FRONTEND_URL"),
    credentials: true,
  });

  // Helmet helps setting appropriate security-related response headers.
  app.use(helmet());

  // Adds a correlation ID to each request and response for tracing.
  app.use((request: Request, response: Response, next: () => void) => {
    const requestId = randomUUID();

    response.setHeader("X-Request-Id", requestId);

    (request as Request & { requestId: string }).requestId = requestId;

    next();
  });

  // Enable global DTO validation.
  // This means every controller using DTO validation automatically gets the same validation behavior.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties that are not defined in the DTO.
      forbidNonWhitelisted: true, // Throw an error if there are properties that are not defined in the DTO.
      transform: true, // Automatically transform incoming values to DTO property types
      // when possible (for example, query string values to numbers).
    }),
  );

  // HTTP/application exceptions converts into consistent HTTP responses.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Retrieve the Redis client registered by AppModule.
  const redisClient = app.get<RedisClientType>("REDIS_CLIENT");

  // Get the secret used to sign/encrypt session information. app failes if SESSION_SECRET is not set in the env.
  const sessionSecret = configService.getOrThrow<string>("SESSION_SECRET");

  // Configure Express server-side sessions.
  app.use(
    session({
      secret: sessionSecret,
      store: new RedisStore({ client: redisClient, prefix: "session:" }), // Store session data in Redis rather than application memory.
      resave: false, // Don't save the session back to Redis if nothing changed.
      saveUninitialized: false, // Don't create empty sessions for unauthenticated requests.

      // Configure the browser session cookie.
      cookie: {
        httpOnly: true, // Prevents client-side JavaScript from accessing the session cookie.
        sameSite: "lax", // Restrict when the browser sends the cookie cross-site.
        secure: configService.get<string>("NODE_ENV") === "production", // Prod: HTTPS, Dev: HTTP
        maxAge: 1000 * 60 * 60 * 24, // Session cookie expires after 24 hours.
      },
    }),
  );
  app.use(passport.initialize()); // Enables Passport authentication strategies for Google OAuth.
  app.use(passport.session()); // Enables Passport to restore the authenticated user from the existing Express session.

  // Swagger/OpenAPI documentation setup.
  const config = new DocumentBuilder()
    .setTitle("API")
    .setDescription("Auto-generated API documentation")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(configService.get<number>("PORT", 3000)); // Start the HTTP server.
}
bootstrap();
