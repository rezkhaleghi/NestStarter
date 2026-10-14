import { describe, expect, it, jest } from "@jest/globals";

import { Page } from "@domain/entities/page.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { PageNotFoundException } from "@domain/exceptions/domain.exception";
import { DeletePageUseCase } from "./delete-page.use-case";

describe("DeletePageUseCase", () => {
  it("deletes the page and records an audit entry", async () => {
    const page = Page.create({
      id: "page-id",
      title: "About",
      slug: "about",
    });

    const repositories = {
      pageRepository: {
        findByIdForUpdate: jest
          .fn<(id: string) => Promise<Page | null>>()
          .mockResolvedValue(page),
        deleteById: jest
          .fn<(id: string) => Promise<void>>()
          .mockResolvedValue(undefined),
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

    await expect(
      new DeletePageUseCase(unitOfWork as any).execute({
        actorUserId: "admin-id",
        id: "page-id",
      }),
    ).resolves.toBeUndefined();

    expect(repositories.pageRepository.findByIdForUpdate).toHaveBeenCalledWith(
      "page-id",
    );
    expect(repositories.pageRepository.deleteById).toHaveBeenCalledWith(
      "page-id",
    );

    expect(repositories.auditLogRepository.create).toHaveBeenCalledTimes(1);

    const audit = repositories.auditLogRepository.create.mock.calls[0][0];

    expect(audit.action).toBe(AuditAction.PAGE_DELETED);
    expect(audit.actorUserId).toBe("admin-id");
    expect(audit.metadata).toMatchObject({
      pageId: "page-id",
      slug: "about",
    });
  });

  it("does not delete or audit a missing page", async () => {
    const repositories = {
      pageRepository: {
        findByIdForUpdate: jest
          .fn<(id: string) => Promise<Page | null>>()
          .mockResolvedValue(null),
        deleteById: jest.fn<(id: string) => Promise<void>>(),
      },
      auditLogRepository: {
        create: jest.fn<(log: any) => Promise<any>>(),
      },
    };

    const unitOfWork = {
      execute: jest.fn(async (work: any) => work(repositories)),
    };

    await expect(
      new DeletePageUseCase(unitOfWork as any).execute({
        actorUserId: "admin-id",
        id: "missing",
      }),
    ).rejects.toBeInstanceOf(PageNotFoundException);

    expect(repositories.pageRepository.deleteById).not.toHaveBeenCalled();
    expect(repositories.auditLogRepository.create).not.toHaveBeenCalled();
  });
});
