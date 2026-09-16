import { UpdateTicketCategoryUseCase } from "./update-ticket-category.use-case";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { TicketCategoryNotFoundException } from "@domain/exceptions/domain.exception";

describe("UpdateTicketCategoryUseCase", () => {
  let useCase: UpdateTicketCategoryUseCase;

  const ticketCategoryRepository = {
    findByIdForUpdate: jest.fn<Promise<TicketCategory | null>, [string]>(),
    save: jest.fn<Promise<TicketCategory>, [TicketCategory]>(),
  };

  const auditLogRepository = {
    create: jest.fn<Promise<AuditLog>, [AuditLog]>(),
  };

  const unitOfWork = {
    execute: jest.fn<Promise<any>, [(repositories: any) => Promise<any>]>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWork.execute.mockImplementation((work) =>
      work({
        ticketCategoryRepository,
        auditLogRepository,
      }),
    );

    auditLogRepository.create.mockImplementation(async (audit) => audit);

    useCase = new UpdateTicketCategoryUseCase(
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it("should update and return the ticket category", async () => {
    const category = TicketCategory.create({
      id: "category-1",
      name: "Old Name",
      description: "Old description",
      isActive: true,
    });

    ticketCategoryRepository.findByIdForUpdate.mockResolvedValue(category);
    ticketCategoryRepository.save.mockResolvedValue(category);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      id: "category-1",
      name: "New Name",
      description: "New description",
      isActive: false,
    });

    expect(result).toBe(category);

    expect(ticketCategoryRepository.findByIdForUpdate).toHaveBeenCalledWith(
      "category-1",
    );

    expect(ticketCategoryRepository.save).toHaveBeenCalledWith(category);

    expect(category.name).toBe("New Name");
    expect(category.description).toBe("New description");
    expect(category.isActive).toBe(false);
  });

  it("should create an audit log with previous and current values", async () => {
    const category = TicketCategory.create({
      id: "category-1",
      name: "Old Name",
      description: "Old description",
      isActive: true,
    });

    ticketCategoryRepository.findByIdForUpdate.mockResolvedValue(category);
    ticketCategoryRepository.save.mockResolvedValue(category);

    await useCase.execute({
      actorUserId: "admin-1",
      id: "category-1",
      name: "New Name",
      description: "New description",
      isActive: false,
    });

    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);

    const audit = auditLogRepository.create.mock.calls[0][0];

    expect(audit).toBeInstanceOf(AuditLog);
    expect(audit.actorUserId).toBe("admin-1");
    expect(audit.targetUserId).toBeNull();
    expect(audit.action).toBe(AuditAction.TICKET_CATEGORY_UPDATED);

    expect(audit.metadata).toEqual({
      categoryId: "category-1",
      previous: {
        name: "Old Name",
        description: "Old description",
        isActive: true,
      },
      current: {
        name: "New Name",
        description: "New description",
        isActive: false,
      },
    });
  });

  it("should throw TicketCategoryNotFoundException when the category does not exist", async () => {
    ticketCategoryRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        id: "category-1",
        name: "New Name",
      }),
    ).rejects.toBeInstanceOf(TicketCategoryNotFoundException);

    expect(ticketCategoryRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("should propagate domain validation errors", async () => {
    const category = TicketCategory.create({
      id: "category-1",
      name: "Existing Name",
      description: "Description",
      isActive: true,
    });

    ticketCategoryRepository.findByIdForUpdate.mockResolvedValue(category);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        id: "category-1",
        name: "   ",
      }),
    ).rejects.toThrow();

    expect(ticketCategoryRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
