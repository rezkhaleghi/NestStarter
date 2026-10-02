import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";
import {
  InvalidWithdrawalAmountException,
  WithdrawalStatusChangeNotAllowedException,
} from "../exceptions/domain.exception";
import { isNegativeDecimal, isZeroDecimal } from "../utils/decimal.util";

export interface CreateWithdrawalProps {
  id?: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  destination: string;
  referenceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestoreWithdrawalProps {
  id: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  status: WithdrawalStatus;
  destination: string;
  referenceId: string;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  rejectionReason: string | null;
}

export class Withdrawal {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly currency: PaymentCurrency,
    public readonly amount: string,
    private status: WithdrawalStatus,
    public readonly destination: string,
    public readonly referenceId: string,
    public transactionId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | null,
    public rejectionReason: string | null,
  ) {}

  getStatus(): WithdrawalStatus {
    return this.status;
  }

  /**
   * Creates a brand-new withdrawal.
   *
   * A new withdrawal can only start as PENDING. Later states are reached
   * exclusively through the domain lifecycle methods below.
   */
  static create(props: CreateWithdrawalProps): Withdrawal {
    if (isNegativeDecimal(props.amount) || isZeroDecimal(props.amount)) {
      throw new InvalidWithdrawalAmountException();
    }

    const now = new Date();

    return new Withdrawal(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
      WithdrawalStatus.PENDING,
      props.destination,
      props.referenceId ?? randomUUID(),
      null,
      props.createdAt ?? now,
      props.updatedAt ?? now,
      null,
      null,
    );
  }

  /**
   * Reconstructs an existing withdrawal from persistence.
   *
   * This is intentionally separate from create(): loading a COMPLETED or
   * REJECTED withdrawal is not the same business operation as creating one.
   */
  static restore(props: RestoreWithdrawalProps): Withdrawal {
    return new Withdrawal(
      props.id,
      props.userId,
      props.currency,
      props.amount,
      props.status,
      props.destination,
      props.referenceId,
      props.transactionId,
      props.createdAt,
      props.updatedAt,
      props.completedAt,
      props.rejectionReason,
    );
  }

  /**
   * Admin approval is the first step before the external/manual transfer.
   */
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

  /**
   * Rejecting is only possible while the withdrawal is still pending.
   */
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

  /**
   * Completion represents the final confirmation that the manual/external
   * transfer was actually performed.
   *
   * There is intentionally no PROCESSING or FAILED state here: those are
   * not part of this application's current withdrawal lifecycle.
   */
  complete(transactionId?: string): void {
    if (this.status !== WithdrawalStatus.APPROVED) {
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
}
