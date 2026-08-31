import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAndAuditIndexes1788183270274 implements MigrationInterface {
  name = "AddUserAndAuditIndexes1788183270274";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_19f0320dbf4e94fabff881c0be" ON "users" ("emailVerified")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_3676155292d72c67cd4e090514" ON "users" ("status")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_204e9b624861ff4a5b26819210" ON "users" ("createdAt")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_5b7fbc8045a0654e5f8db27dc5" ON "audit_logs" ("targetUserId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_e36d23e1e7cf81ea77758bef79" ON "audit_logs" ("actorUserId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e36d23e1e7cf81ea77758bef79"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b7fbc8045a0654e5f8db27dc5"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_204e9b624861ff4a5b26819210"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_3676155292d72c67cd4e090514"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_19f0320dbf4e94fabff881c0be"`,
    );
  }
}
