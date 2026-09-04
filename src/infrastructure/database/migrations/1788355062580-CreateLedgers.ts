import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLedgers1788355062580 implements MigrationInterface {
  name = "CreateLedgers1788355062580";

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * Create the enum used by ledgers.
     */
    await queryRunner.query(`
      CREATE TYPE "public"."ledgers_type_enum"
      AS ENUM(
        'ADMIN_ADJUSTMENT',
        'DEPOSIT',
        'WITHDRAWAL',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'REFUND'
      )
    `);

    /**
     * Create ledgers table.
     *
     * Ledger records are append-only and represent every balance
     * mutation together with the balance before and after the mutation.
     */
    await queryRunner.query(`
      CREATE TABLE "ledgers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "currency" "public"."user_balances_currency_enum" NOT NULL,
        "amount" numeric(30,18) NOT NULL,
        "balanceBefore" numeric(30,18) NOT NULL,
        "balanceAfter" numeric(30,18) NOT NULL,
        "type" "public"."ledgers_type_enum" NOT NULL,
        "actorUserId" uuid,
        "referenceId" uuid,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ledgers"
          PRIMARY KEY ("id")
      )
    `);

    /**
     * Index user ledger history by user and creation time.
     *
     * This supports queries such as:
     *   - Get a user's ledger history
     *   - Get the newest ledger records first
     */
    await queryRunner.query(`
      CREATE INDEX "IDX_ledgers_userId_createdAt"
      ON "ledgers" ("userId", "createdAt")
    `);

    /**
     * Index actorUserId because administrative balance adjustments
     * may need to be queried by the administrator who performed them.
     */
    await queryRunner.query(`
      CREATE INDEX "IDX_ledgers_actorUserId"
      ON "ledgers" ("actorUserId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Remove indexes before dropping the table.
     */
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_ledgers_actorUserId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_ledgers_userId_createdAt"
    `);

    /**
     * Remove ledgers table.
     */
    await queryRunner.query(`
      DROP TABLE "ledgers"
    `);

    /**
     * Remove the ledger type enum.
     */
    await queryRunner.query(`
      DROP TYPE "public"."ledgers_type_enum"
    `);
  }
}
