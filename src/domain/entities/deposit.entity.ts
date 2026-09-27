import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { PaymentProvider } from "../enums/payment-provider.enum";
import { DepositStatus } from "../enums/deposit-status.enum";

import {
  DepositCannotFailException,
  DepositChangeStatusNotAllowedException,
  InvalidDepositAmountException,
} from "@domain/exceptions/domain.exception";

import { isNegativeDecimal, isZeroDecimal } from "../utils/decimal.util";

export interface CreateDepositProps {
  id?: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  provider: PaymentProvider;
  idempotencyKey: string;
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
  idempotencyKey: string | null;
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
    public readonly idempotencyKey: string | null,
    public status: DepositStatus,
    public readonly referenceId: string,
    public providerPaymentId: string | null,
    public transactionId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | null,
  ) {}

  /**
   * Creates a new deposit.
   *
   * Idempotency is part of creation because the key identifies the
   * client operation that produced this deposit. A retry must be able
   * to resolve back to the same business record.
   */
  static create(props: CreateDepositProps): Deposit {
    if (isNegativeDecimal(props.amount) || isZeroDecimal(props.amount)) {
      throw new InvalidDepositAmountException();
    }

    if (!props.idempotencyKey.trim()) {
      throw new Error("Deposit idempotency key must not be empty.");
    }

    const now = new Date();

    return new Deposit(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
      props.provider,
      props.idempotencyKey,
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
   * Rehydrates persisted state without applying creation defaults.
   *
   * Existing deposits may predate idempotency support, therefore the
   * persisted key is nullable during this compatibility period.
   */
  static restore(props: RestoreDepositProps): Deposit {
    return new Deposit(
      props.id,
      props.userId,
      props.currency,
      props.amount,
      props.provider,
      props.idempotencyKey,
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
