import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";

@Entity("user_balances")
@Index(["userId", "currency"], { unique: true })
export class UserBalanceOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({
    type: "enum",
    enum: PaymentCurrency,
  })
  currency: PaymentCurrency;

  @Column({
    type: "numeric",
    precision: 30,
    scale: 18,
    default: 0,
  })
  amount: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
