import { describe, expect, it, jest } from "@jest/globals";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { CreateTicketCategoryUseCase } from "./create-ticket-category.use-case";

describe("CreateTicketCategoryUseCase", () => {
  it("creates a category and audits the action", async () => {
    const category = TicketCategory.create({
      id: "category-id",
      name: "Technical",
      description: "Technical support",
      isActive: true,
    });

    const repositories = {
      ticketCategoryRepository: {
        create:
          jest.fn<(category: TicketCategory) => Promise<TicketCategory>>(),
      },
      auditLogRepository: {
        create: jest.fn<(audit: unknown) => Promise<void>>(),
      },
    };

    repositories.ticketCategoryRepository.create.mockResolvedValue(category);

    const unitOfWork = {
      execute: jest.fn(async (work: any) => work(repositories)),
    };

    const result = await new CreateTicketCategoryUseCase(
      unitOfWork as any,
    ).execute({
      actorUserId: "admin-id",
      name: " Technical ",
      description: " Technical support ",
    });

    expect(result).toBe(category);

    const created =
      repositories.ticketCategoryRepository.create.mock.calls[0][0];

    expect(created).toBeInstanceOf(TicketCategory);
    expect(created.name).toBe("Technical");
    expect(created.description).toBe("Technical support");

    const audit = repositories.auditLogRepository.create.mock.calls[0][0] as {
      action: AuditAction;
      actorUserId: string;
    };

    expect(audit.action).toBe(AuditAction.TICKET_CATEGORY_CREATED);
    expect(audit.actorUserId).toBe("admin-id");
  });

  it("defaults a new category to active", async () => {
    const repositories = {
      ticketCategoryRepository: {
        create:
          jest.fn<(category: TicketCategory) => Promise<TicketCategory>>(),
      },
      auditLogRepository: {
        create: jest.fn<(audit: unknown) => Promise<void>>(),
      },
    };

    repositories.ticketCategoryRepository.create.mockImplementation(
      async (category) => category,
    );

    const unitOfWork = {
      execute: jest.fn(async (work: any) => work(repositories)),
    };

    const result = await new CreateTicketCategoryUseCase(
      unitOfWork as any,
    ).execute({
      actorUserId: "admin-id",
      name: "Technical",
    });

    expect(result.isActive).toBe(true);
  });
});
