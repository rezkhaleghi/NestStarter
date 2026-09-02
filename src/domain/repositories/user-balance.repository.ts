import { UserBalance } from "../entities/user-balance.entity";
import { PaymentCurrency } from "../enums/payment-currency.enum";
import { PageQuery, PageResult } from "../../shared/pagination/page-query";

export type UserBalanceSortBy = "currency" | "amount" | "createdAt";

export abstract class UserBalanceRepository {
  abstract create(balance: UserBalance): Promise<UserBalance>;

  abstract findByUserIdAndCurrency(
    userId: string,
    currency: PaymentCurrency,
  ): Promise<UserBalance | null>;

  abstract findByUserId(
    userId: string,
    query: PageQuery<UserBalanceSortBy>,
  ): Promise<PageResult<UserBalance>>;

  abstract save(balance: UserBalance): Promise<UserBalance>;
}
