import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import {
  addDecimal,
  isNegativeDecimal,
  isZeroDecimal,
} from "../utils/decimal.util";
import {
  InsufficientBalanceException,
  InvalidUserBalanceException,
} from "@domain/exceptions/domain.exception";

export interface CreateUserBalanceProps {
  id?: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
}

export class UserBalance {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public currency: PaymentCurrency,
    private _amount: string,
  ) {}

  static create(props: CreateUserBalanceProps): UserBalance {
    if (isNegativeDecimal(props.amount)) {
      throw new InvalidUserBalanceException();
    }

    return new UserBalance(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
    );
  }

  get amount(): string {
    return this._amount;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Increases the current balance by a positive amount.
   */
  credit(amount: string): void {
    if (isNegativeDecimal(amount) || isZeroDecimal(amount)) {
      throw new InvalidUserBalanceException();
    }

    const newAmount = addDecimal(this._amount, amount);

    if (isNegativeDecimal(newAmount)) {
      throw new InvalidUserBalanceException();
    }

    this._amount = newAmount;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Decreases the current balance by a positive amount.
   * A balance can never become negative.
   */
  debit(amount: string): void {
    if (isNegativeDecimal(amount) || isZeroDecimal(amount)) {
      throw new InvalidUserBalanceException();
    }

    const newAmount = addDecimal(this._amount, `-${amount}`);

    if (isNegativeDecimal(newAmount)) {
      throw new InsufficientBalanceException();
    }

    this._amount = newAmount;
  }

  /**
   * Business operation with rules/invariants.
   *
   * Used for administrative signed adjustments:
   * +100 → increase balance
   * -100 → decrease balance
   */
  adjust(amount: string): void {
    if (isZeroDecimal(amount)) {
      return;
    }

    const newAmount = addDecimal(this._amount, amount);

    if (isNegativeDecimal(newAmount)) {
      throw new InsufficientBalanceException();
    }

    this._amount = newAmount;
  }
}
