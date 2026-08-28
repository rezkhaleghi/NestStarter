import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class CreateAuditLogs1710000000001 implements MigrationInterface {
  name = "CreateAuditLogs1710000000001";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "audit_logs",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "actorUserId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "action",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "targetUserId",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            isNullable: false,
            default: "now()",
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      "audit_logs",
      new TableIndex({
        name: "IDX_audit_logs_actorUserId",
        columnNames: ["actorUserId"],
      }),
    );

    await queryRunner.createIndex(
      "audit_logs",
      new TableIndex({
        name: "IDX_audit_logs_targetUserId",
        columnNames: ["targetUserId"],
      }),
    );

    await queryRunner.createIndex(
      "audit_logs",
      new TableIndex({
        name: "IDX_audit_logs_action",
        columnNames: ["action"],
      }),
    );

    await queryRunner.createIndex(
      "audit_logs",
      new TableIndex({
        name: "IDX_audit_logs_createdAt",
        columnNames: ["createdAt"],
      }),
    );

    await queryRunner.createForeignKey(
      "audit_logs",
      new TableForeignKey({
        name: "FK_audit_logs_actorUser",
        columnNames: ["actorUserId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );

    await queryRunner.createForeignKey(
      "audit_logs",
      new TableForeignKey({
        name: "FK_audit_logs_targetUser",
        columnNames: ["targetUserId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("audit_logs", "FK_audit_logs_targetUser");

    await queryRunner.dropForeignKey("audit_logs", "FK_audit_logs_actorUser");

    await queryRunner.dropIndex("audit_logs", "IDX_audit_logs_createdAt");

    await queryRunner.dropIndex("audit_logs", "IDX_audit_logs_action");

    await queryRunner.dropIndex("audit_logs", "IDX_audit_logs_targetUserId");

    await queryRunner.dropIndex("audit_logs", "IDX_audit_logs_actorUserId");

    await queryRunner.dropTable("audit_logs");
  }
}
