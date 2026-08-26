import { DomainExceptionFilter } from "./api/domain-exception.filter";
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableShutdownHooks();
  if (configService.get<string>("NODE_ENV") === "production") {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }
  app.enableCors({
    origin: configService.getOrThrow<string>("FRONTEND_URL"),
    credentials: true,
  });
  app.use(helmet());
  app.use((request: Request, response: Response, next: () => void) => {
    const requestId = request.header("X-Request-Id") ?? randomUUID();
    response.setHeader("X-Request-Id", requestId);
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());

  const redisClient = app.get<RedisClientType>("REDIS_CLIENT");
  const sessionSecret = configService.getOrThrow<string>("SESSION_SECRET");

  // Session must be set up before passport.session()
  app.use(
    session({
      secret: sessionSecret,
      store: new RedisStore({ client: redisClient, prefix: "session:" }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: configService.get<string>("NODE_ENV") === "production",
        maxAge: 1000 * 60 * 60 * 24,
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  const config = new DocumentBuilder()
    .setTitle("API")
    .setDescription("Auto-generated API documentation")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(configService.get<number>("PORT", 3000));
}
bootstrap();
