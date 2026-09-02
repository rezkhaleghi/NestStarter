import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export class UserBalance {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public currency: PaymentCurrency,
    public amount: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
