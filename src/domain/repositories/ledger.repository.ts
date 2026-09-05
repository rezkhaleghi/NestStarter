import { Ledger } from "../entities/ledger.entity";
import { AdminLedgerSearchFilters } from "./admin-ledger-search-filters";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export abstract class LedgerRepository {
  abstract create(ledger: Ledger): Promise<Ledger>;

  abstract findById(id: string): Promise<Ledger | null>;

  abstract findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Ledger[]>;

  abstract countByUserId(userId: string): Promise<number>;

  abstract searchAdminLedgers(
    filters: AdminLedgerSearchFilters,
    params: PageQuery<"createdAt" | "amount">,
  ): Promise<PageResult<Ledger>>;
}
