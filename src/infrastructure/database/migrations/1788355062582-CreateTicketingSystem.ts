import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketingSystem1788355062582 implements MigrationInterface {
  name = "CreateTicketingSystem1788355062582";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."tickets_status_enum"
      AS ENUM(
        'OPEN',
        'IN_PROGRESS',
        'WAITING_FOR_USER',
        'WAITING_FOR_SUPPORT',
        'RESOLVED',
        'CLOSED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tickets_priority_enum"
      AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT')
    `);

    await queryRunner.query(`
      CREATE TABLE "ticket_categories" (
        "id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ticket_categories_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_categories_isActive"
      ON "ticket_categories" ("isActive")
    `);

    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "categoryId" uuid,
        "subject" character varying(255) NOT NULL,
        "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'OPEN',
        "priority" "public"."tickets_priority_enum" NOT NULL DEFAULT 'NORMAL',
        "assignedToUserId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "closedAt" TIMESTAMP,
        CONSTRAINT "PK_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tickets_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION,
        CONSTRAINT "FK_tickets_categoryId"
          FOREIGN KEY ("categoryId") REFERENCES "ticket_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tickets_assignedToUserId"
          FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_userId_createdAt"
      ON "tickets" ("userId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_status_createdAt"
      ON "tickets" ("status", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_priority_createdAt"
      ON "tickets" ("priority", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_categoryId"
      ON "tickets" ("categoryId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_assignedToUserId"
      ON "tickets" ("assignedToUserId")
    `);

    await queryRunner.query(`
      CREATE TABLE "ticket_messages" (
        "id" uuid NOT NULL,
        "ticketId" uuid NOT NULL,
        "senderUserId" uuid NOT NULL,
        "body" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ticket_messages_ticketId"
          FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ticket_messages_senderUserId"
          FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_messages_ticketId_createdAt"
      ON "ticket_messages" ("ticketId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_messages_senderUserId"
      ON "ticket_messages" ("senderUserId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_ticket_messages_senderUserId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_ticket_messages_ticketId_createdAt"
    `);
    await queryRunner.query(`DROP TABLE "ticket_messages"`);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_tickets_assignedToUserId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_tickets_categoryId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_tickets_priority_createdAt"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_tickets_status_createdAt"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_tickets_userId_createdAt"
    `);
    await queryRunner.query(`DROP TABLE "tickets"`);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_ticket_categories_isActive"
    `);
    await queryRunner.query(`DROP TABLE "ticket_categories"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
  }
}
