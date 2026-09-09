import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { DepositStatus } from "../enums/deposit-status.enum";

export interface CreateDepositProps {
  id?: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  status?: DepositStatus;
  referenceId?: string;
  providerPaymentId?: string | null;
  transactionId?: string | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Deposit {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly currency: PaymentCurrency,
    public readonly amount: string,
    public status: DepositStatus,
    public readonly referenceId: string,
    public providerPaymentId: string | null,
    public transactionId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | null,
  ) {}

  static create(props: CreateDepositProps): Deposit {
    return new Deposit(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
      props.status ?? DepositStatus.PENDING,
      props.referenceId ?? randomUUID(),
      props.providerPaymentId ?? null,
      props.transactionId ?? null,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.completedAt ?? null,
    );
  }

  setProviderPayment(providerPaymentId: string): void {
    this.providerPaymentId = providerPaymentId;
    this.updatedAt = new Date();
  }

  markCompleted(transactionId?: string): void {
    if (this.status === DepositStatus.COMPLETED) {
      return;
    }

    this.status = DepositStatus.COMPLETED;
    this.transactionId = transactionId ?? this.transactionId;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  markFailed(): void {
    if (this.status === DepositStatus.COMPLETED) {
      return;
    }
    this.status = DepositStatus.FAILED;
    this.updatedAt = new Date();
  }

  markCancelled(): void {
    if (this.status === DepositStatus.COMPLETED) {
      return;
    }
    this.status = DepositStatus.CANCELLED;
    this.updatedAt = new Date();
  }
}
