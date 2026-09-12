import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";
import { WithdrawalStatusChangeNotAllowedException } from "../exceptions/domain.exception";

export interface CreateWithdrawalProps {
  id?: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  status?: WithdrawalStatus;
  destination: string;
  referenceId?: string;
  providerWithdrawalId?: string | null;
  transactionId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date | null;
  rejectionReason?: string | null;
}

export class Withdrawal {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly currency: PaymentCurrency,
    public readonly amount: string,
    public status: WithdrawalStatus,
    public readonly destination: string,
    public readonly referenceId: string,
    public providerWithdrawalId: string | null,
    public transactionId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | null,
    public rejectionReason: string | null,
  ) {}

  static create(props: CreateWithdrawalProps): Withdrawal {
    return new Withdrawal(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
      props.status ?? WithdrawalStatus.PENDING,
      props.destination,
      props.referenceId ?? randomUUID(),
      props.providerWithdrawalId ?? null,
      props.transactionId ?? null,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.completedAt ?? null,
      props.rejectionReason ?? null,
    );
  }

  approve(): void {
    if (this.status !== WithdrawalStatus.PENDING) {
      throw new WithdrawalStatusChangeNotAllowedException(
        "approved",
        this.status,
      );
    }

    this.status = WithdrawalStatus.APPROVED;
    this.updatedAt = new Date();
  }

  startProcessing(providerWithdrawalId?: string): void {
    if (this.status !== WithdrawalStatus.APPROVED) {
      throw new WithdrawalStatusChangeNotAllowedException(
        "moved to PROCESSING",
        this.status,
      );
    }

    this.status = WithdrawalStatus.PROCESSING;

    if (providerWithdrawalId) {
      this.providerWithdrawalId = providerWithdrawalId;
    }

    this.updatedAt = new Date();
  }

  markCompleted(transactionId?: string): void {
    if (this.status !== WithdrawalStatus.PROCESSING) {
      throw new WithdrawalStatusChangeNotAllowedException(
        "completed",
        this.status,
      );
    }

    this.status = WithdrawalStatus.COMPLETED;
    this.transactionId = transactionId ?? this.transactionId;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  reject(reason?: string): void {
    if (this.status !== WithdrawalStatus.PENDING) {
      throw new WithdrawalStatusChangeNotAllowedException(
        "rejected",
        this.status,
      );
    }

    this.status = WithdrawalStatus.REJECTED;
    this.rejectionReason = reason ?? null;
    this.updatedAt = new Date();
  }

  markFailed(reason?: string): void {
    if (this.status !== WithdrawalStatus.PROCESSING) {
      throw new WithdrawalStatusChangeNotAllowedException(
        "marked as failed",
        this.status,
      );
    }

    this.status = WithdrawalStatus.FAILED;
    this.rejectionReason = reason ?? this.rejectionReason;
    this.updatedAt = new Date();
  }
}
