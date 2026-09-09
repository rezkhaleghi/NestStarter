import { Withdrawal } from "../entities/withdrawal.entity";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export type WithdrawalSortBy = "createdAt" | "amount";

export interface WithdrawalSearchFilters {
  userId?: string;
  currency?: string;
  status?: string;
  referenceId?: string;
  providerWithdrawalId?: string;
  from?: Date;
  to?: Date;
}

export abstract class WithdrawalRepository {
  abstract create(withdrawal: Withdrawal): Promise<Withdrawal>;
  abstract save(withdrawal: Withdrawal): Promise<Withdrawal>;
  abstract findById(id: string): Promise<Withdrawal | null>;
  abstract findByIdForUpdate(id: string): Promise<Withdrawal | null>;
  abstract search(
    filters: WithdrawalSearchFilters,
    params: PageQuery<WithdrawalSortBy>,
  ): Promise<PageResult<Withdrawal>>;
}
