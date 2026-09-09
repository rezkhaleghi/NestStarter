import { Injectable } from "@nestjs/common";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export interface ListWithdrawalsInput extends PageQuery<
  "createdAt" | "amount"
> {
  userId?: string;
  currency?: string;
  status?: string;
  referenceId?: string;
  providerWithdrawalId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class ListWithdrawalsUseCase {
  constructor(private readonly withdrawalRepository: WithdrawalRepository) {}

  async execute(input: ListWithdrawalsInput): Promise<PageResult<Withdrawal>> {
    return this.withdrawalRepository.search(
      {
        userId: input.userId,
        currency: input.currency,
        status: input.status,
        referenceId: input.referenceId,
        providerWithdrawalId: input.providerWithdrawalId,
        from: input.from,
        to: input.to,
      },
      {
        page: input.page,
        limit: input.limit,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
      },
    );
  }
}
