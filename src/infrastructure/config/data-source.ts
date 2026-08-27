import { DataSource } from "typeorm";
import { UserOrmEntity } from "../database/orm-entities/user.orm-entity";

/**
 * TypeORM CLI data source configuration.
 *
 * This file is used by the TypeORM CLI for database operations
 * such as generating, running, and reverting migrations.
 *
 * It is separate from NestJS configuration because the TypeORM CLI
 * runs independently of the NestJS application and dependency injection.
 */
export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [UserOrmEntity],
  migrations: [__dirname + "/../database/migrations/*.{js,ts}"],
  synchronize: false,
});

//                     Database
//                        │
//           ┌────────────┴────────────┐
//           │                         │
//       NestJS app                TypeORM CLI
//           │                         │
//           ▼                         ▼
// typeorm-config.ts             data-source.ts
//           │                         │
//           ▼                         ▼
//    TypeOrmModule              DataSource
