import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";

import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationStatus } from "@domain/enums/notification-status.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";

import { UserOrmEntity } from "./user.orm-entity";

@Entity("notifications")
@Index(["userId", "createdAt"])
@Index(["type"])
@Index(["channel"])
@Index(["status"])
export class NotificationOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  // The relationship belongs to infrastructure. The domain notification
  // only knows the user's identifier and does not depend on TypeORM.
  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column({
    type: "enum",
    enum: NotificationChannel,
  })
  channel!: NotificationChannel;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "uuid", nullable: true })
  referenceId!: string | null;

  @Column({ type: "timestamp", nullable: true })
  sentAt!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  readAt!: Date | null;

  @Column({ type: "text", nullable: true })
  failureReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
