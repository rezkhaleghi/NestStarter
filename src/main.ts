import { DomainExceptionFilter } from "./api/domain-exception.filter";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import session = require("express-session");
import * as passport from "passport";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());

  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? "6379"),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });
  await redisClient.connect();

  // Session must be set up before passport.session()
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
      store: new RedisStore({ client: redisClient, prefix: "session:" }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
