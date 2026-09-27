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

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

import { UserOrmEntity } from "./user.orm-entity";

@Entity("user_balances")
@Index(["userId", "currency"], { unique: true })
export class UserBalanceOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  // The balance belongs to a real user, and the database must enforce that
  // relationship independently of application-level validation.
  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

  @Column({
    type: "enum",
    enum: PaymentCurrency,
  })
  currency!: PaymentCurrency;

  @Column({
    type: "numeric",
    precision: 30,
    scale: 18,
    default: 0,
  })
  amount!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
