import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { LedgerType } from "../enums/ledger-type.enum";
import {
  addDecimal,
  isZeroDecimal,
  subtractDecimal,
} from "../utils/decimal.util";

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
}

export interface RestoreLedgerProps {
  id: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  type: LedgerType;
  actorUserId: string | null;
  referenceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
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
    this.assertBalanceInvariant(
      props.amount,
      props.balanceBefore,
      props.balanceAfter,
    );

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
      new Date(),
    );
  }

  static restore(props: RestoreLedgerProps): Ledger {
    this.assertBalanceInvariant(
      props.amount,
      props.balanceBefore,
      props.balanceAfter,
    );

    return new Ledger(
      props.id,
      props.userId,
      props.currency,
      props.amount,
      props.balanceBefore,
      props.balanceAfter,
      props.type,
      props.actorUserId,
      props.referenceId,
      props.metadata,
      props.createdAt,
    );
  }

  private static assertBalanceInvariant(
    amount: string,
    balanceBefore: string,
    balanceAfter: string,
  ): void {
    const expectedBalanceAfter = addDecimal(balanceBefore, amount);

    if (!isZeroDecimal(subtractDecimal(expectedBalanceAfter, balanceAfter))) {
      throw new Error(
        "Invalid ledger entry: balanceBefore + amount must equal balanceAfter.",
      );
    }
  }
}
