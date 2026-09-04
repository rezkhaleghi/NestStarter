import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { LedgerType } from "../enums/ledger-type.enum";

export interface CreateLedgerProps {
  id?: string;

  userId: string;

  currency: PaymentCurrency;

  amount: string;

  balanceBefore: string;

  balanceAfter: string;

  type: LedgerType;

  actorUserId?: string | null;

  referenceId?: string | null;

  metadata?: Record<string, unknown> | null;

  createdAt?: Date;
}

export class Ledger {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly currency: PaymentCurrency,
    public readonly amount: string,
    public readonly balanceBefore: string,
    public readonly balanceAfter: string,
    public readonly type: LedgerType,
    public readonly actorUserId: string | null,
    public readonly referenceId: string | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateLedgerProps): Ledger {
    return new Ledger(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
      props.balanceBefore,
      props.balanceAfter,
      props.type,
      props.actorUserId ?? null,
      props.referenceId ?? null,
      props.metadata ?? null,
      props.createdAt ?? new Date(),
    );
  }
}
