import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { ListWithdrawalsUseCase } from "./list-withdrawals.use-case";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";
import { PageResult } from "@shared/pagination/page-query";

describe("ListWithdrawalsUseCase", () => {
  let useCase: ListWithdrawalsUseCase;

  const withdrawalRepository = {
    search: jest.fn<() => Promise<PageResult<Withdrawal>>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new ListWithdrawalsUseCase(
      withdrawalRepository as unknown as WithdrawalRepository,
    );
  });

  it("should return withdrawals", async () => {
    const withdrawal = Withdrawal.create({
      id: "withdrawal-1",
      userId: "user-1",
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
    });

    const result: PageResult<Withdrawal> = {
      data: [withdrawal],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    };

    withdrawalRepository.search.mockResolvedValue(result);

    const response = await useCase.execute({
      userId: "user-1",
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });

    expect(response).toBe(result);

    expect(withdrawalRepository.search).toHaveBeenCalledWith(
      {
        userId: "user-1",
        currency: undefined,
        status: undefined,
        referenceId: undefined,
        providerWithdrawalId: undefined,
        from: undefined,
        to: undefined,
      },
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });

  it("should pass all filters to the repository", async () => {
    const result: PageResult<Withdrawal> = {
      data: [],
      page: 2,
      limit: 10,
      total: 0,
      totalPages: 0,
    };

    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");

    withdrawalRepository.search.mockResolvedValue(result);

    await useCase.execute({
      userId: "user-1",
      currency: PaymentCurrency.USD,
      status: "PENDING",
      referenceId: "reference-1",
      providerWithdrawalId: "provider-1",
      from,
      to,
      page: 2,
      limit: 10,
      sortBy: "amount",
      sortDirection: "ASC",
    });

    expect(withdrawalRepository.search).toHaveBeenCalledWith(
      {
        userId: "user-1",
        currency: PaymentCurrency.USD,
        status: "PENDING",
        referenceId: "reference-1",
        providerWithdrawalId: "provider-1",
        from,
        to,
      },
      {
        page: 2,
        limit: 10,
        sortBy: "amount",
        sortDirection: "ASC",
      },
    );
  });
});
