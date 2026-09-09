import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";

@Entity("deposits")
@Index(["userId", "createdAt"])
@Index(["referenceId"], { unique: true })
export class DepositOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: PaymentCurrency })
  currency!: PaymentCurrency;

  @Column({ type: "decimal", precision: 30, scale: 18 })
  amount!: string;

  @Column({ type: "enum", enum: DepositStatus, default: DepositStatus.PENDING })
  status!: DepositStatus;

  @Column({ type: "uuid" })
  referenceId!: string;

  @Column({ type: "varchar", nullable: true })
  providerPaymentId!: string | null;

  @Column({ type: "varchar", nullable: true })
  transactionId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt!: Date | null;
}
