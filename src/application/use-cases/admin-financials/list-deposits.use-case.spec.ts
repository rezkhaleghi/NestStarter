import { describe, expect, it, jest } from "@jest/globals";

import { AdminListDepositsUseCase } from "./list-deposits.use-case";

describe("AdminListDepositsUseCase", () => {
  it("lists admin deposits", async () => {
    const repository = {
      search: jest.fn<() => Promise<any>>(),
    };

    const page = {
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

    repository.search.mockResolvedValue(page);

    const result = await new AdminListDepositsUseCase(
      repository as any,
    ).execute({
      page: 1,
      limit: 20,
    });

    expect(result).toBe(page);
    expect(repository.search).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: undefined,
        currency: undefined,
        status: undefined,
        referenceId: undefined,
        providerPaymentId: undefined,
        from: undefined,
        to: undefined,
      }),
      expect.objectContaining({
        page: 1,
        limit: 20,
        sortBy: undefined,
        sortDirection: undefined,
      }),
    );
  });
});
