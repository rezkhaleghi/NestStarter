import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketAuditActions1788355062583 implements MigrationInterface {
  name = "AddTicketAuditActions1788355062583";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const actions = [
      "TICKET_CREATED",
      "TICKET_MESSAGE_CREATED",
      "TICKET_STATUS_CHANGED",
      "TICKET_PRIORITY_CHANGED",
      "TICKET_ASSIGNED",
      "TICKET_UNASSIGNED",
      "TICKET_CATEGORY_CHANGED",
      "TICKET_CLOSED",
    ];

    for (const action of actions) {
      await queryRunner.query(
        `ALTER TYPE "public"."audit_logs_action_enum" ADD VALUE IF NOT EXISTS '${action}'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM "audit_logs"
        WHERE "action"::text IN (
          'TICKET_CREATED',
          'TICKET_MESSAGE_CREATED',
          'TICKET_STATUS_CHANGED',
          'TICKET_PRIORITY_CHANGED',
          'TICKET_ASSIGNED',
          'TICKET_UNASSIGNED',
          'TICKET_CATEGORY_CHANGED',
          'TICKET_CLOSED'
        )
      ) AS "hasTicketActions"
    `);

    if (result[0]?.hasTicketActions) {
      throw new Error(
        "Cannot revert ticket audit actions while audit log records use them.",
      );
    }

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "action"
      TYPE character varying
      USING "action"::text
    `);

    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);

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

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "action"
      TYPE "public"."audit_logs_action_enum"
      USING "action"::text::"public"."audit_logs_action_enum"
    `);
  }
}
