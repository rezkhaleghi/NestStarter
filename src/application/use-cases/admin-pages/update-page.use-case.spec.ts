import { describe, expect, it, jest } from "@jest/globals";

import { Page } from "@domain/entities/page.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { PageStatus } from "@domain/enums/page-status.enum";
import { PageNotFoundException } from "@domain/exceptions/domain.exception";
import { UpdatePageUseCase } from "./update-page.use-case";

describe("UpdatePageUseCase", () => {
  it("locks the page, sanitizes supplied content, saves, and audits", async () => {
    const page = Page.create({
      id: "page-id",
      title: "About",
      slug: "about",
      content: "Old content",
    });

    const repositories = {
      pageRepository: {
        findByIdForUpdate: jest
          .fn<(id: string) => Promise<Page | null>>()
          .mockResolvedValue(page),
        save: jest
          .fn<(value: Page) => Promise<Page>>()
          .mockImplementation(async (value) => value),
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

    const sanitizer = {
      sanitize: jest.fn<(html: string) => string>(() => "<p>Safe</p>"),
    };

    const result = await new UpdatePageUseCase(
      unitOfWork as any,
      sanitizer as any,
    ).execute({
      actorUserId: "admin-id",
      id: "page-id",
      title: "About Us",
      slug: "about-us",
      content: '<p onclick="bad()">Safe</p>',
      status: PageStatus.PUBLISHED,
    });

    expect(result.title).toBe("About Us");
    expect(result.slug).toBe("about-us");
    expect(result.content).toBe("<p>Safe</p>");
    expect(result.status).toBe(PageStatus.PUBLISHED);

    expect(sanitizer.sanitize).toHaveBeenCalledWith(
      '<p onclick="bad()">Safe</p>',
    );

    expect(repositories.pageRepository.findByIdForUpdate).toHaveBeenCalledWith(
      "page-id",
    );
    expect(repositories.pageRepository.save).toHaveBeenCalledWith(page);

    expect(repositories.auditLogRepository.create).toHaveBeenCalledTimes(1);

    const audit = repositories.auditLogRepository.create.mock.calls[0][0];

    expect(audit.action).toBe(AuditAction.PAGE_UPDATED);
    expect(audit.actorUserId).toBe("admin-id");
    expect(audit.metadata).toMatchObject({
      pageId: "page-id",
      slug: "about-us",
      status: PageStatus.PUBLISHED,
    });
  });

  it("throws when the page does not exist", async () => {
    const repositories = {
      pageRepository: {
        findByIdForUpdate: jest
          .fn<(id: string) => Promise<Page | null>>()
          .mockResolvedValue(null),
        save: jest.fn<(value: Page) => Promise<Page>>(),
      },
      auditLogRepository: {
        create: jest.fn<(log: any) => Promise<any>>(),
      },
    };

    const unitOfWork = {
      execute: jest.fn(async (work: any) => work(repositories)),
    };

    const sanitizer = {
      sanitize: jest.fn<(html: string) => string>((html) => html),
    };

    await expect(
      new UpdatePageUseCase(unitOfWork as any, sanitizer as any).execute({
        actorUserId: "admin-id",
        id: "missing",
        title: "New title",
      }),
    ).rejects.toBeInstanceOf(PageNotFoundException);

    expect(repositories.pageRepository.save).not.toHaveBeenCalled();
    expect(repositories.auditLogRepository.create).not.toHaveBeenCalled();
  });
});
