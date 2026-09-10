import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDepositProviderPaymentIdUniqueIndex1788355062584 implements MigrationInterface {
  name = "AddDepositProviderPaymentIdUniqueIndex1788355062584";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_deposits_providerPaymentId_unique"
      ON "deposits" ("providerPaymentId")
      WHERE "providerPaymentId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_deposits_providerPaymentId_unique"
    `);
  }
}
