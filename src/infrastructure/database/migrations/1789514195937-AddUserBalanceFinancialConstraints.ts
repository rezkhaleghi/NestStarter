import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBalanceFinancialConstraints1789514195937 implements MigrationInterface {
  name = "AddUserBalanceFinancialConstraints1789514195937";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_balances"
      ADD CONSTRAINT "CHK_user_balances_amount_non_negative"
      CHECK ("amount" >= 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_balances"
      DROP CONSTRAINT IF EXISTS "CHK_user_balances_amount_non_negative"
    `);
  }
}
