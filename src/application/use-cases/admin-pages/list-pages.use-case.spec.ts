import { describe, expect, it, jest } from "@jest/globals";

import { PageStatus } from "@domain/enums/page-status.enum";
import { ListPagesUseCase } from "./list-pages.use-case";

describe("ListAdminPagesUseCase", () => {
  it("forwards filters and pagination to the repository", async () => {
    const result = {
      data: [],
      page: 2,
      limit: 10,
      total: 0,
      totalPages: 0,
    };
    const pageRepository = {
      findPage: jest.fn().mockResolvedValue(result),
    };

    await expect(
      new ListPagesUseCase(pageRepository as any).execute({
        page: 2,
        limit: 10,
        sortBy: "title",
        sortDirection: "ASC",
        status: PageStatus.DRAFT,
      }),
    ).resolves.toBe(result);

    expect(pageRepository.findPage).toHaveBeenCalledWith(
      { status: PageStatus.DRAFT },
      {
        page: 2,
        limit: 10,
        sortBy: "title",
        sortDirection: "ASC",
      },
    );
  });
});
