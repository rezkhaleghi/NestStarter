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
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";

import { UserOrmEntity } from "./user.orm-entity";

@Entity("withdrawals")
@Index(["userId", "createdAt"])
@Index(["referenceId"], { unique: true })
export class WithdrawalOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  // Keep the user relationship in infrastructure only. The domain entity
  // intentionally remains independent from TypeORM and UserOrmEntity.
  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

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
