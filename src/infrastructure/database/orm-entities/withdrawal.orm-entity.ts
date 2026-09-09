import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";

@Entity("withdrawals")
@Index(["userId", "createdAt"])
@Index(["referenceId"], { unique: true })
export class WithdrawalOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: PaymentCurrency })
  currency!: PaymentCurrency;

  @Column({ type: "decimal", precision: 30, scale: 18 })
  amount!: string;

  @Column({
    type: "enum",
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status!: WithdrawalStatus;

  @Column({ type: "text" })
  destination!: string;

  @Column({ type: "uuid" })
  referenceId!: string;

  @Column({ type: "varchar", nullable: true })
  providerWithdrawalId!: string | null;

  @Column({ type: "varchar", nullable: true })
  transactionId!: string | null;

  @Column({ type: "text", nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt!: Date | null;
}
