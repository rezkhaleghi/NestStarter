import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { UserOrmEntity } from "../database/orm-entities/user.orm-entity";
import { AuditLogOrmEntity } from "../database/orm-entities/audit-log.orm-entity";
import { UserBalanceOrmEntity } from "@infrastructure/database/orm-entities/user-balance.orm-entity";
import { LedgerOrmEntity } from "@infrastructure/database/orm-entities/ledger.orm-entity";

/**
 * NestJS database configuration.
 *
 * This configuration is used by TypeORM when running
 * inside the NestJS application.
 */
export default registerAs(
  "database",
  (): TypeOrmModuleOptions => ({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [
      UserOrmEntity,
      AuditLogOrmEntity,
      UserBalanceOrmEntity,
      LedgerOrmEntity,
    ],
    // synchronize: process.env.NODE_ENV === "development",
    synchronize: false,
    extra: {
      max: 10,
    },
  }),
);

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
