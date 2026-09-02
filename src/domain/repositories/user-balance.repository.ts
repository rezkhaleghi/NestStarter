import { UserBalance } from "../entities/user-balance.entity";
import { PaymentCurrency } from "../enums/payment-currency.enum";

export abstract class UserBalanceRepository {
  abstract create(balance: UserBalance): Promise<UserBalance>;

  abstract findByUserIdAndCurrency(
    userId: string,
    currency: PaymentCurrency,
  ): Promise<UserBalance | null>;
}
