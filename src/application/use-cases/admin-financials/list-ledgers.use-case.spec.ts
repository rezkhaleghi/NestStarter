import { describe, expect, it, jest } from "@jest/globals";

import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { ListLedgersUseCase } from "./list-ledgers.use-case";

describe("ListLedgersUseCase", () => {
  it("lists admin ledgers with filters and pagination", async () => {
    const repository = {
      searchAdminLedgers: jest.fn<() => Promise<any>>(),
    };

    const page = {
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

    repository.searchAdminLedgers.mockResolvedValue(page);

    const result = await new ListLedgersUseCase(repository as any).execute({
      userId: "user-id",
      currency: PaymentCurrency.USD,
      type: LedgerType.DEPOSIT,
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });

    expect(result).toBe(page);

    expect(repository.searchAdminLedgers).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        currency: PaymentCurrency.USD,
        type: LedgerType.DEPOSIT,
      }),
      expect.objectContaining({
        page: 1,
        limit: 20,
      }),
    );
  });
});
