import { describe, expect, it, jest } from "@jest/globals";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { TicketCategoryNotFoundException } from "@domain/exceptions/domain.exception";
import { DeactivateTicketCategoryUseCase } from "./deactive-ticket-category.use-case";

describe("DeactivateTicketCategoryUseCase", () => {
  it("deactivates the category and audits the action", async () => {
    const category = TicketCategory.create({
      id: "category-id",
      name: "Technical",
      isActive: true,
    });

    const repositories = {
      ticketCategoryRepository: {
        findByIdForUpdate:
          jest.fn<(id: string) => Promise<TicketCategory | null>>(),
        save: jest.fn<(category: TicketCategory) => Promise<TicketCategory>>(),
      },
      auditLogRepository: {
        create: jest.fn<(audit: unknown) => Promise<void>>(),
      },
    };

    repositories.ticketCategoryRepository.findByIdForUpdate.mockResolvedValue(
      category,
    );
    repositories.ticketCategoryRepository.save.mockResolvedValue(category);

    const unitOfWork = {
      execute: jest.fn(async (work: any) => work(repositories)),
    };

    await new DeactivateTicketCategoryUseCase(unitOfWork as any).execute({
      actorUserId: "admin-id",
      id: "category-id",
    });

    expect(category.isActive).toBe(false);

    expect(
      repositories.ticketCategoryRepository.findByIdForUpdate,
    ).toHaveBeenCalledWith("category-id");

    expect(repositories.ticketCategoryRepository.save).toHaveBeenCalledWith(
      category,
    );

    const audit = repositories.auditLogRepository.create.mock.calls[0][0] as {
      action: AuditAction;
    };

    expect(audit.action).toBe(AuditAction.TICKET_CATEGORY_DEACTIVATED);
  });

  it("throws when the category does not exist", async () => {
    const repositories = {
      ticketCategoryRepository: {
        findByIdForUpdate:
          jest.fn<(id: string) => Promise<TicketCategory | null>>(),
        save: jest.fn<(category: TicketCategory) => Promise<TicketCategory>>(),
      },
      auditLogRepository: {
        create: jest.fn<(audit: unknown) => Promise<void>>(),
      },
    };

    repositories.ticketCategoryRepository.findByIdForUpdate.mockResolvedValue(
      null,
    );

    const unitOfWork = {
      execute: jest.fn(async (work: any) => work(repositories)),
    };

    await expect(
      new DeactivateTicketCategoryUseCase(unitOfWork as any).execute({
        actorUserId: "admin-id",
        id: "category-id",
      }),
    ).rejects.toBeInstanceOf(TicketCategoryNotFoundException);

    expect(repositories.ticketCategoryRepository.save).not.toHaveBeenCalled();
    expect(repositories.auditLogRepository.create).not.toHaveBeenCalled();
  });
});
