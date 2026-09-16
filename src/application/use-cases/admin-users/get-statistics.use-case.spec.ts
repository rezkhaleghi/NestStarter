import { describe, expect, it, jest } from "@jest/globals";

import { AdminStatistics } from "@application/interfaces/admin-statistics.interface";
import { GetAdminStatisticsUseCase } from "./get-statistics.use-case";

describe("GetAdminStatisticsUseCase", () => {
  it("returns statistics from the statistics service", async () => {
    const statistics = {} as AdminStatistics;

    const adminStatisticsService = {
      getStatistics: jest.fn<() => Promise<AdminStatistics>>(),
    };

    adminStatisticsService.getStatistics.mockResolvedValue(statistics);

    const result = await new GetAdminStatisticsUseCase(
      adminStatisticsService as any,
    ).execute();

    expect(result).toBe(statistics);
    expect(adminStatisticsService.getStatistics).toHaveBeenCalledTimes(1);
  });

  it("propagates errors from the statistics service", async () => {
    const error = new Error("statistics failed");

    const adminStatisticsService = {
      getStatistics: jest.fn<() => Promise<AdminStatistics>>(),
    };

    adminStatisticsService.getStatistics.mockRejectedValue(error);

    await expect(
      new GetAdminStatisticsUseCase(adminStatisticsService as any).execute(),
    ).rejects.toBe(error);
  });
});
