import { randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { isNegativeDecimal } from "../utils/decimal.util";

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
    public amount: string,
  ) {}

  static create(props: CreateUserBalanceProps): UserBalance {
    if (isNegativeDecimal(props.amount)) {
      throw new Error("User balance cannot be negative.");
    }

    return new UserBalance(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
    );
  }
}
