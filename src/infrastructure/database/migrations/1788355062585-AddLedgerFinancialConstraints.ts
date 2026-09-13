import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLedgerFinancialConstraints1788355062585 implements MigrationInterface {
  name = "AddLedgerFinancialConstraints1788355062585";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ledgers"
      ADD CONSTRAINT "CHK_ledgers_amount_non_zero"
      CHECK ("amount" <> 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "ledgers"
      ADD CONSTRAINT "CHK_ledgers_balance_before_non_negative"
      CHECK ("balanceBefore" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "ledgers"
      ADD CONSTRAINT "CHK_ledgers_balance_after_non_negative"
      CHECK ("balanceAfter" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "ledgers"
      ADD CONSTRAINT "CHK_ledgers_balance_invariant"
      CHECK ("balanceAfter" = "balanceBefore" + "amount")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ledgers"
      DROP CONSTRAINT IF EXISTS "CHK_ledgers_balance_invariant"
    `);

    await queryRunner.query(`
      ALTER TABLE "ledgers"
      DROP CONSTRAINT IF EXISTS "CHK_ledgers_balance_after_non_negative"
    `);

    await queryRunner.query(`
      ALTER TABLE "ledgers"
      DROP CONSTRAINT IF EXISTS "CHK_ledgers_balance_before_non_negative"
    `);

    await queryRunner.query(`
      ALTER TABLE "ledgers"
      DROP CONSTRAINT IF EXISTS "CHK_ledgers_amount_non_zero"
    `);
  }
}
