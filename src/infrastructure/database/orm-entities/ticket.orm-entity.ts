import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";

import { TicketMessageOrmEntity } from "./ticket-message.orm-entity";
import { UserOrmEntity } from "./user.orm-entity";
import { TicketCategoryOrmEntity } from "./ticket-category.orm-entity";

@Entity("tickets")
@Index(["userId", "createdAt"])
@Index(["status", "createdAt"])
@Index(["priority", "createdAt"])
@Index(["categoryId"])
@Index(["assignedToUserId"])
export class TicketOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  /**
   * The user who owns/created the ticket.
   *
   * A ticket is historical support data, so its owner must remain a valid
   * user reference. We therefore deliberately prevent deleting a referenced
   * user instead of silently converting the ticket into an orphan.
   */
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

  @Column({ type: "uuid", nullable: true })
  categoryId!: string | null;

  /**
   * Categories are optional metadata. Removing a category should not remove
   * or invalidate an existing ticket.
   */
  @ManyToOne(() => TicketCategoryOrmEntity, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category?: TicketCategoryOrmEntity;

  @Column({ type: "varchar", length: 255 })
  subject!: string;

  @Column({
    type: "enum",
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status!: TicketStatus;

  @Column({
    type: "enum",
    enum: TicketPriority,
    default: TicketPriority.NORMAL,
  })
  priority!: TicketPriority;

  @Column({ type: "uuid", nullable: true })
  assignedToUserId!: string | null;

  /**
   * Assignment is optional and belongs to an operational relationship.
   * If an admin is removed, the ticket should simply become unassigned.
   */
  @ManyToOne(() => UserOrmEntity, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "assignedToUserId" })
  assignedToUser?: UserOrmEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  closedAt!: Date | null;

  @OneToMany(() => TicketMessageOrmEntity, (message) => message.ticket)
  messages?: TicketMessageOrmEntity[];
}
