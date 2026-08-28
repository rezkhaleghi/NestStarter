import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AuditAction } from "../../../domain/enums/audit-action.enum";

@Entity("audit_logs")
@Index(["actorUserId"])
@Index(["targetUserId"])
@Index(["action"])
@Index(["createdAt"])
export class AuditLogOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  actorUserId!: string;

  @Column({
    type: "enum",
    enum: AuditAction,
  })
  action!: AuditAction;

  @Column({ type: "uuid", nullable: true })
  targetUserId!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
