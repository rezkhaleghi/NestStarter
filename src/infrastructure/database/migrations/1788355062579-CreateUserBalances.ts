import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserBalances1788355062579 implements MigrationInterface {
  name = "CreateUserBalances1788355062579";

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * Create the enum used by user_balances.
     */
    await queryRunner.query(`
      CREATE TYPE "public"."user_balances_currency_enum"
      AS ENUM('IRR', 'USD', 'EUR', 'USDT', 'BTC', 'TRX')
    `);

    /**
     * Create user_balances table.
     */
    await queryRunner.query(`
      CREATE TABLE "user_balances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "currency" "public"."user_balances_currency_enum" NOT NULL,
        "amount" numeric(30,18) NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bf6c91bf949d39175f095c6c3d4"
          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_balances_user_currency"
          UNIQUE ("userId", "currency")
      )
    `);

    /**
     * The audit_logs.action column already contains existing data.
     *
     * The generated TypeORM migration tried to:
     *
     *   1. DROP action
     *   2. CREATE a new enum
     *   3. ADD action as NOT NULL
     *
     * That fails because existing audit_logs rows would have NULL
     * values during the ADD COLUMN operation.
     *
     * Instead, create the new enum and convert the existing column
     * in-place so existing audit log records are preserved.
     */

    await queryRunner.query(`
      CREATE TYPE "public"."audit_logs_action_enum"
      AS ENUM(
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'USER_PASSWORD_CHANGED',
        'USER_AVATAR_DELETED',
        'USER_ROLE_CHANGED',
        'USER_BALANCE_CREATED',
        'USER_BALANCE_UPDATED'
      )
    `);

    /**
     * Drop only the action index temporarily because the column type
     * is being changed.
     */
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_cee5459245f652b75eb2759b4c"
    `);

    /**
     * Convert the existing varchar action column to the new enum.
     *
     * Existing values are preserved.
     */
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "action"
      TYPE "public"."audit_logs_action_enum"
      USING "action"::text::"public"."audit_logs_action_enum"
    `);

    /**
     * Recreate the action index.
     */
    await queryRunner.query(`
      CREATE INDEX "IDX_cee5459245f652b75eb2759b4c"
      ON "audit_logs" ("action")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Remove the action index before converting the enum back.
     */
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_cee5459245f652b75eb2759b4c"
    `);

    /**
     * Convert audit_logs.action back to varchar.
     *
     * Existing audit records are preserved.
     */
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "action"
      TYPE character varying
      USING "action"::text
    `);

    /**
     * Remove the enum introduced by this migration.
     */
    await queryRunner.query(`
      DROP TYPE "public"."audit_logs_action_enum"
    `);

    /**
     * Remove user balances.
     */
    await queryRunner.query(`
      DROP TABLE "user_balances"
    `);

    /**
     * Remove the currency enum.
     */
    await queryRunner.query(`
      DROP TYPE "public"."user_balances_currency_enum"
    `);

    /**
     * Restore the action index.
     */
    await queryRunner.query(`
      CREATE INDEX "IDX_cee5459245f652b75eb2759b4c"
      ON "audit_logs" ("action")
    `);
  }
}
