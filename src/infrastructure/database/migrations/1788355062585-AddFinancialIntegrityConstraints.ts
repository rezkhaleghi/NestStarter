import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinancialIntegrityConstraints1788355062585 implements MigrationInterface {
  name = "AddFinancialIntegrityConstraints1788355062585";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const invalidBalances = await queryRunner.query(`
      SELECT
        COUNT(*)::int AS "count"
      FROM "user_balances"
      WHERE "amount" < 0
    `);

    if (invalidBalances[0].count > 0) {
      throw new Error(
        `Cannot add user balance integrity constraint: ${invalidBalances[0].count} existing balance(s) have a negative amount.`,
      );
    }

    const invalidLedgers = await queryRunner.query(`
      SELECT
        COUNT(*)::int AS "count"
      FROM "ledgers"
      WHERE
        "balanceBefore" < 0
        OR "balanceAfter" < 0
        OR "balanceBefore" + "amount" <> "balanceAfter"
    `);

    if (invalidLedgers[0].count > 0) {
      throw new Error(
        `Cannot add ledger integrity constraints: ${invalidLedgers[0].count} existing ledger entry/entries violate financial invariants.`,
      );
    }

    await queryRunner.query(`
      ALTER TABLE "user_balances"
      ADD CONSTRAINT "CHK_user_balances_amount_non_negative"
      CHECK ("amount" >= 0)
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
      CHECK ("balanceBefore" + "amount" = "balanceAfter")
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
      ALTER TABLE "user_balances"
      DROP CONSTRAINT IF EXISTS "CHK_user_balances_amount_non_negative"
    `);
  }
}
