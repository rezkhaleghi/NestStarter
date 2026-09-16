import { ListDepositsUseCase } from "./list-deposits.use-case";

import { Deposit } from "@domain/entities/deposit.entity";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { PageResult } from "@shared/pagination/page-query";

describe("ListDepositsUseCase", () => {
  let useCase: ListDepositsUseCase;

  const depositRepositoryMock = {
    search: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new ListDepositsUseCase(
      depositRepositoryMock as unknown as DepositRepository,
    );
  });

  it("should search deposits with all filters and pagination", async () => {
    const result: PageResult<Deposit> = {
      data: [
        {
          id: "deposit-1",
          userId: "user-1",
        } as Deposit,
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    depositRepositoryMock.search.mockResolvedValue(result);

    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");

    const input = {
      userId: "user-1",
      currency: "USDT",
      status: "PENDING",
      referenceId: "reference-1",
      providerPaymentId: "payment-1",
      from,
      to,
      page: 1,
      limit: 10,
      sortBy: "createdAt" as const,
      sortDirection: "DESC" as const,
    };

    const response = await useCase.execute(input);

    expect(response).toBe(result);

    expect(depositRepositoryMock.search).toHaveBeenCalledWith(
      {
        userId: "user-1",
        currency: "USDT",
        status: "PENDING",
        referenceId: "reference-1",
        providerPaymentId: "payment-1",
        from,
        to,
      },
      {
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });

  it("should forward undefined optional filters", async () => {
    const result: PageResult<Deposit> = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    depositRepositoryMock.search.mockResolvedValue(result);

    const input = {
      userId: "user-1",
      page: 1,
      limit: 10,
      sortBy: "amount" as const,
      sortDirection: "ASC" as const,
    };

    const response = await useCase.execute(input);

    expect(response).toBe(result);

    expect(depositRepositoryMock.search).toHaveBeenCalledWith(
      {
        userId: "user-1",
        currency: undefined,
        status: undefined,
        referenceId: undefined,
        providerPaymentId: undefined,
        from: undefined,
        to: undefined,
      },
      {
        page: 1,
        limit: 10,
        sortBy: "amount",
        sortDirection: "ASC",
      },
    );
  });
});
