import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { PaymentProvider } from "../enums/payment-provider.enum";
import { DepositStatus } from "../enums/deposit-status.enum";

import {
  DepositCannotFailException,
  DepositChangeStatusNotAllowedException,
  InvalidDepositAmountException,
  InvalidDepositCompletionException,
} from "@domain/exceptions/domain.exception";

import { isNegativeDecimal, isZeroDecimal } from "../utils/decimal.util";

export interface CreateDepositProps {
  id?: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  provider: PaymentProvider;
  status?: DepositStatus;
  referenceId?: string;
  providerPaymentId?: string | null;
  transactionId?: string | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestoreDepositProps {
  id: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  provider: PaymentProvider;
  status: DepositStatus;
  referenceId: string;
  providerPaymentId: string | null;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export class Deposit {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly currency: PaymentCurrency,
    public readonly amount: string,
    public readonly provider: PaymentProvider,
    public status: DepositStatus,
    public readonly referenceId: string,
    public providerPaymentId: string | null,
    public transactionId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | null,
  ) {}

  /**
   * Creates a new deposit in the application domain.
   *
   * This path is intentionally separate from restore() because creation
   * represents a new business operation and therefore applies creation-time
   * invariants/defaults.
   */
  static create(props: CreateDepositProps): Deposit {
    if (isNegativeDecimal(props.amount) || isZeroDecimal(props.amount)) {
      throw new InvalidDepositAmountException();
    }

    if (props.status !== DepositStatus.COMPLETED && props.completedAt != null) {
      throw new InvalidDepositCompletionException();
    }

    if (props.status === DepositStatus.COMPLETED && props.completedAt == null) {
      throw new InvalidDepositCompletionException();
    }

    const now = new Date();

    return new Deposit(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
      props.provider,
      props.status ?? DepositStatus.PENDING,
      props.referenceId ?? randomUUID(),
      props.providerPaymentId ?? null,
      props.transactionId ?? null,
      props.createdAt ?? now,
      props.updatedAt ?? now,
      props.completedAt ?? null,
    );
  }

  /**
   * Rehydrates an existing deposit from persistence.
   *
   * Restore must preserve database state exactly, including historical
   * timestamps and provider/payment identifiers. It must not behave like
   * creating a new deposit.
   */
  static restore(props: RestoreDepositProps): Deposit {
    return new Deposit(
      props.id,
      props.userId,
      props.currency,
      props.amount,
      props.provider,
      props.status,
      props.referenceId,
      props.providerPaymentId,
      props.transactionId,
      props.createdAt,
      props.updatedAt,
      props.completedAt,
    );
  }

  setProviderPayment(providerPaymentId: string): void {
    this.providerPaymentId = providerPaymentId;
    this.updatedAt = new Date();
  }

  markCompleted(transactionId?: string): void {
    if (this.status !== DepositStatus.PENDING) {
      throw new DepositChangeStatusNotAllowedException(this.status);
    }

    this.status = DepositStatus.COMPLETED;
    this.transactionId = transactionId ?? this.transactionId;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  markFailed(): void {
    if (this.status !== DepositStatus.PENDING) {
      throw new DepositCannotFailException(this.status);
    }

    this.status = DepositStatus.FAILED;
    this.updatedAt = new Date();
  }
}
