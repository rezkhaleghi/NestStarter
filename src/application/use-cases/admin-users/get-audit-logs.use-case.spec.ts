import { describe, expect, it, jest } from "@jest/globals";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { GetAuditLogsUseCase } from "./get-audit-logs.use-case";

describe("GetAuditLogsUseCase", () => {
  it("gets audit logs with filters and pagination", async () => {
    const repository = {
      findPage: jest.fn<() => Promise<any>>(),
    };

    const page = {
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-01-31T23:59:59.999Z");

    repository.findPage.mockResolvedValue(page);

    const result = await new GetAuditLogsUseCase(repository as any).execute(
      {
        action: AuditAction.USER_BALANCE_UPDATED,
        actorUserId: "admin-id",
        targetUserId: "user-id",
        from,
        to,
      },
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );

    expect(result).toBe(page);

    expect(repository.findPage).toHaveBeenCalledWith(
      {
        action: AuditAction.USER_BALANCE_UPDATED,
        actorUserId: "admin-id",
        targetUserId: "user-id",
        from,
        to,
      },
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });

  it("propagates repository errors", async () => {
    const repository = {
      findPage: jest.fn<() => Promise<any>>(),
    };

    const error = new Error("database error");

    repository.findPage.mockRejectedValue(error);

    await expect(
      new GetAuditLogsUseCase(repository as any).execute(
        {},
        {
          page: 1,
          limit: 20,
          sortBy: "createdAt",
          sortDirection: "DESC",
        },
      ),
    ).rejects.toBe(error);
  });
});
