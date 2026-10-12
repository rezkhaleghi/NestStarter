import { describe, expect, it, jest } from "@jest/globals";

import { Page } from "@domain/entities/page.entity";
import { PageNotFoundException } from "@domain/exceptions/domain.exception";
import { GetPageUseCase } from "./get-page.use-case";

describe("GetAdminPageUseCase", () => {
  it("returns a page, including a draft", async () => {
    const page = Page.create({
      id: "page-id",
      title: "Draft",
      slug: "draft",
    });
    const pageRepository = {
      findById: jest.fn().mockResolvedValue(page),
    };

    await expect(
      new GetPageUseCase(pageRepository as any).execute("page-id"),
    ).resolves.toBe(page);
  });

  it("throws when the page does not exist", async () => {
    const pageRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };

    await expect(
      new GetPageUseCase(pageRepository as any).execute("missing"),
    ).rejects.toBeInstanceOf(PageNotFoundException);
  });
});
