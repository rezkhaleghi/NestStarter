import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserStatus1787935610962 implements MigrationInterface {
  name = "AddUserStatus1787935610962";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'restricted')`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "status" "public"."users_status_enum"
      NOT NULL DEFAULT 'active'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "status"
    `);

    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
  }
}
