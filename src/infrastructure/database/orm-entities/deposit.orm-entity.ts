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
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";

import { UserOrmEntity } from "./user.orm-entity";

@Entity("deposits")
@Index(["userId", "createdAt"])
@Index(["referenceId"], { unique: true })
@Index(["providerPaymentId"], { unique: true })
export class DepositOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  // The domain only needs userId. This relation exists at the persistence
  // boundary so PostgreSQL can enforce that every deposit belongs to a real user.
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
    enum: DepositStatus,
    default: DepositStatus.PENDING,
  })
  status!: DepositStatus;

  @Column({
    type: "enum",
    enum: PaymentProvider,
  })
  provider!: PaymentProvider;

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
