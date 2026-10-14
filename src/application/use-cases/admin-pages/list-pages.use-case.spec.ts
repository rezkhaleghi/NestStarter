import { describe, expect, it, jest } from "@jest/globals";

import { Page } from "@domain/entities/page.entity";
import { PageStatus } from "@domain/enums/page-status.enum";
import { PageFilters } from "@domain/repositories/page.repository";
import { PageQuery, PageResult } from "@shared/pagination/page-query";
import { ListPagesUseCase } from "./list-pages.use-case";

describe("ListAdminPagesUseCase", () => {
  it("forwards filters and pagination to the repository", async () => {
    const result: PageResult<Page> = {
      data: [],
      page: 2,
      limit: 10,
      total: 0,
      totalPages: 0,
    };

    const pageRepository = {
      findPage: jest
        .fn<
          (
            filters: PageFilters,
            params: PageQuery<"createdAt" | "updatedAt" | "title">,
          ) => Promise<PageResult<Page>>
        >()
        .mockResolvedValue(result),
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
