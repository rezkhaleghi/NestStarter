import { describe, expect, it, jest } from "@jest/globals";

import { Page } from "@domain/entities/page.entity";
import { PageStatus } from "@domain/enums/page-status.enum";
import { PageNotFoundException } from "@domain/exceptions/domain.exception";
import { GetPublicPageUseCase } from "./get-page.use-case";

describe("GetPublicPageUseCase", () => {
  it("returns only a published page and sanitizes its content", async () => {
    const page = Page.create({
      title: "About",
      slug: "about",
      content: "<script>bad()</script><p>Good</p>",
      status: PageStatus.PUBLISHED,
    });
    const pageRepository = {
      findPublishedBySlug: jest.fn().mockResolvedValue(page),
    };
    const sanitizer = {
      sanitize: jest.fn<(html: string) => string>(() => "<p>Good</p>"),
    };

    const result = await new GetPublicPageUseCase(
      pageRepository as any,
      sanitizer as any,
    ).execute("about");

    expect(pageRepository.findPublishedBySlug).toHaveBeenCalledWith("about");
    expect(sanitizer.sanitize).toHaveBeenCalledWith(
      "<script>bad()</script><p>Good</p>",
    );
    expect(result.content).toBe("<p>Good</p>");
  });

  it("returns 404 behavior for drafts and unknown slugs", async () => {
    const pageRepository = {
      findPublishedBySlug: jest.fn().mockResolvedValue(null),
    };
    const sanitizer = { sanitize: (html: string) => html };

    await expect(
      new GetPublicPageUseCase(pageRepository as any, sanitizer as any).execute(
        "draft-page",
      ),
    ).rejects.toBeInstanceOf(PageNotFoundException);
  });
});
