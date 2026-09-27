import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { TicketOrmEntity } from "./ticket.orm-entity";
import { UserOrmEntity } from "./user.orm-entity";

@Entity("ticket_messages")
@Index(["ticketId", "createdAt"])
@Index(["senderUserId"])
export class TicketMessageOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  /**
   * A message cannot exist without its ticket.
   *
   * Deleting a ticket removes its messages as part of the aggregate cleanup.
   */
  @Column({ type: "uuid" })
  ticketId!: string;

  @ManyToOne(() => TicketOrmEntity, (ticket) => ticket.messages, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "ticketId" })
  ticket!: TicketOrmEntity;

  /**
   * Keep the sender reference intact.
   *
   * Support messages are part of the historical record. Deleting a user
   * must therefore not cascade-delete their messages.
   */
  @Column({ type: "uuid" })
  senderUserId!: string;

  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "senderUserId" })
  sender!: UserOrmEntity;

  @Column({ type: "text" })
  body!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
