import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDepositsAndWithdrawals1788355062581 implements MigrationInterface {
  name = "CreateDepositsAndWithdrawals1788355062581";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."deposits_status_enum"
      AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."withdrawals_status_enum"
      AS ENUM('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TABLE "deposits" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "currency" "public"."user_balances_currency_enum" NOT NULL,
        "amount" numeric(30,18) NOT NULL,
        "status" "public"."deposits_status_enum" NOT NULL DEFAULT 'PENDING',
        "referenceId" uuid NOT NULL,
        "providerPaymentId" character varying,
        "transactionId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP,
        CONSTRAINT "PK_deposits" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_deposits_referenceId" UNIQUE ("referenceId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_deposits_userId_createdAt"
      ON "deposits" ("userId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE TABLE "withdrawals" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "currency" "public"."user_balances_currency_enum" NOT NULL,
        "amount" numeric(30,18) NOT NULL,
        "status" "public"."withdrawals_status_enum" NOT NULL DEFAULT 'PENDING',
        "destination" text NOT NULL,
        "referenceId" uuid NOT NULL,
        "providerWithdrawalId" character varying,
        "transactionId" character varying,
        "rejectionReason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP,
        CONSTRAINT "PK_withdrawals" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_withdrawals_referenceId" UNIQUE ("referenceId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_withdrawals_userId_createdAt"
      ON "withdrawals" ("userId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_withdrawals_userId_createdAt"
    `);

    await queryRunner.query(`DROP TABLE "withdrawals"`);
    await queryRunner.query(`DROP TYPE "public"."withdrawals_status_enum"`);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_deposits_userId_createdAt"
    `);

    await queryRunner.query(`DROP TABLE "deposits"`);
    await queryRunner.query(`DROP TYPE "public"."deposits_status_enum"`);
  }
}
