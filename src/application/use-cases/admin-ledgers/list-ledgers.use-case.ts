import { Injectable } from "@nestjs/common";

import { Ledger } from "../../../domain/entities/ledger.entity";
import { LedgerType } from "../../../domain/enums/ledger-type.enum";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { AdminLedgerSearchFilters } from "../../../domain/repositories/admin-ledger-search-filters";
import { LedgerRepository } from "../../../domain/repositories/ledger.repository";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export interface ListLedgersInput extends PageQuery<"createdAt" | "amount"> {
  userId?: string;
  currency?: PaymentCurrency;
  type?: LedgerType;
  actorUserId?: string;
  referenceId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class ListLedgersUseCase {
  constructor(private readonly ledgerRepository: LedgerRepository) {}

  async execute(input: ListLedgersInput): Promise<PageResult<Ledger>> {
    const filters: AdminLedgerSearchFilters = {
      userId: input.userId,
      currency: input.currency,
      type: input.type,
      actorUserId: input.actorUserId,
      referenceId: input.referenceId,
      from: input.from,
      to: input.to,
    };

    return this.ledgerRepository.searchAdminLedgers(filters, {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    });
  }
}
