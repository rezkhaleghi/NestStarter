import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

import { LedgerType } from "../../../domain/enums/ledger-type.enum";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";

@Entity("ledgers")
@Index(["userId", "createdAt"])
export class LedgerOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  userId: string;

  @Column({
    type: "enum",
    enum: PaymentCurrency,
  })
  currency: PaymentCurrency;

  @Column({
    type: "decimal",
    precision: 30,
    scale: 8,
  })
  amount: string;

  @Column({
    type: "decimal",
    precision: 30,
    scale: 8,
  })
  balanceBefore: string;

  @Column({
    type: "decimal",
    precision: 30,
    scale: 8,
  })
  balanceAfter: string;

  @Column({
    type: "enum",
    enum: LedgerType,
  })
  type: LedgerType;

  @Column({
    type: "uuid",
    nullable: true,
  })
  actorUserId: string | null;

  @Column({
    type: "uuid",
    nullable: true,
  })
  referenceId: string | null;

  @Column({
    type: "jsonb",
    nullable: true,
  })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
