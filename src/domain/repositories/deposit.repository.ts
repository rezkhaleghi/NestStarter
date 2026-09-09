import { Deposit } from "../entities/deposit.entity";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export type DepositSortBy = "createdAt" | "amount";

export interface DepositSearchFilters {
  userId?: string;
  currency?: string;
  status?: string;
  referenceId?: string;
  providerPaymentId?: string;
  from?: Date;
  to?: Date;
}

export abstract class DepositRepository {
  abstract create(deposit: Deposit): Promise<Deposit>;
  abstract save(deposit: Deposit): Promise<Deposit>;
  abstract findById(id: string): Promise<Deposit | null>;
  abstract findByIdForUpdate(id: string): Promise<Deposit | null>;
  abstract findByReferenceId(referenceId: string): Promise<Deposit | null>;
  abstract search(
    filters: DepositSearchFilters,
    params: PageQuery<DepositSortBy>,
  ): Promise<PageResult<Deposit>>;
}
