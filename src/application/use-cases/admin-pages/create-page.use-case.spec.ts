import { describe, expect, it, jest } from "@jest/globals";

import { Page } from "@domain/entities/page.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { PageStatus } from "@domain/enums/page-status.enum";
import { CreatePageUseCase } from "./create-page.use-case";

describe("CreatePageUseCase", () => {
  it("sanitizes content, creates the page, and audits the action", async () => {
    const savedPage = Page.create({
      id: "page-id",
      title: "About Us",
      slug: "about-us",
      content: "<p>Safe</p>",
    });

    const repositories = {
      pageRepository: {
        create: jest.fn<(page: Page) => Promise<Page>>(),
      },
      auditLogRepository: {
        create: jest.fn<(log: any) => Promise<any>>(),
      },
    };

    repositories.pageRepository.create.mockResolvedValue(savedPage);
    repositories.auditLogRepository.create.mockResolvedValue(undefined);

    const unitOfWork = {
      execute: jest.fn(async (work: any) => work(repositories)),
    };
    const sanitizer = {
      sanitize: jest.fn<(html: string) => string>(() => "<p>Safe</p>"),
    };

    const result = await new CreatePageUseCase(
      unitOfWork as any,
      sanitizer as any,
    ).execute({
      actorUserId: "admin-id",
      title: "About Us",
      slug: "about-us",
      content: '<p onclick="alert(1)">Safe</p>',
    });

    expect(result).toBe(savedPage);
    expect(sanitizer.sanitize).toHaveBeenCalledWith(
      '<p onclick="alert(1)">Safe</p>',
    );

    const created = repositories.pageRepository.create.mock.calls[0][0];
    expect(created.content).toBe("<p>Safe</p>");
    expect(created.status).toBe(PageStatus.DRAFT);

    const audit = repositories.auditLogRepository.create.mock.calls[0][0];
    expect(audit.action).toBe(AuditAction.PAGE_CREATED);
    expect(audit.actorUserId).toBe("admin-id");
    expect(audit.metadata).toMatchObject({
      pageId: "page-id",
      slug: "about-us",
      status: PageStatus.DRAFT,
    });
  });

  it("allows explicitly creating a published page", async () => {
    const published = Page.create({
      id: "page-id",
      title: "Terms",
      slug: "terms",
      status: PageStatus.PUBLISHED,
    });

    const repositories = {
      pageRepository: {
        create: jest
          .fn<(page: Page) => Promise<Page>>()
          .mockResolvedValue(published),
      },
      auditLogRepository: {
        create: jest
          .fn<(log: any) => Promise<any>>()
          .mockResolvedValue(undefined),
      },
    };
    const unitOfWork = {
      execute: jest.fn(async (work: any) => work(repositories)),
    };
    const sanitizer = { sanitize: (html: string) => html };

    await new CreatePageUseCase(unitOfWork as any, sanitizer as any).execute({
      actorUserId: "admin-id",
      title: "Terms",
      slug: "terms",
      status: PageStatus.PUBLISHED,
    });

    expect(repositories.pageRepository.create.mock.calls[0][0].status).toBe(
      PageStatus.PUBLISHED,
    );
  });
});
