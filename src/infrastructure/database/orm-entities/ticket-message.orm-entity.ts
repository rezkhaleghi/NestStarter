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

  @Column({ type: "uuid" })
  ticketId!: string;

  @ManyToOne(() => TicketOrmEntity, (ticket) => ticket.messages, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "ticketId" })
  ticket!: TicketOrmEntity;

  @Column({ type: "uuid" })
  senderUserId!: string;

  @ManyToOne(() => UserOrmEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "senderUserId" })
  sender?: UserOrmEntity;

  @Column({ type: "text" })
  body!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
