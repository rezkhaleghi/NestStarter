import { UpdateTicketPriorityUseCase } from "./update-ticket-priority.use-case";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { TicketNotFoundException } from "@domain/exceptions/domain.exception";

describe("UpdateTicketPriorityUseCase", () => {
  let useCase: UpdateTicketPriorityUseCase;

  const ticketRepository = {
    findByIdForUpdate: jest.fn<Promise<Ticket | null>, [string]>(),
    save: jest.fn<Promise<Ticket>, [Ticket]>(),
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
        ticketRepository,
        auditLogRepository,
      }),
    );

    auditLogRepository.create.mockImplementation(async (audit) => audit);

    useCase = new UpdateTicketPriorityUseCase(
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it("should update and save the ticket priority", async () => {
    const ticket = Ticket.create({
      id: "ticket-1",
      userId: "user-1",
      subject: "Support request",
      priority: TicketPriority.NORMAL,
    });

    ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    ticketRepository.save.mockResolvedValue(ticket);

    await useCase.execute({
      actorUserId: "admin-1",
      ticketId: "ticket-1",
      priority: TicketPriority.HIGH,
    });

    expect(ticketRepository.findByIdForUpdate).toHaveBeenCalledWith("ticket-1");

    expect(ticket.priority).toBe(TicketPriority.HIGH);
    expect(ticketRepository.save).toHaveBeenCalledWith(ticket);
  });

  it("should create an audit log with the previous and new priority", async () => {
    const ticket = Ticket.create({
      id: "ticket-1",
      userId: "user-1",
      subject: "Support request",
      priority: TicketPriority.NORMAL,
    });

    ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    ticketRepository.save.mockResolvedValue(ticket);

    await useCase.execute({
      actorUserId: "admin-1",
      ticketId: "ticket-1",
      priority: TicketPriority.HIGH,
    });

    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);

    const audit = auditLogRepository.create.mock.calls[0][0];

    expect(audit).toBeInstanceOf(AuditLog);
    expect(audit.actorUserId).toBe("admin-1");
    expect(audit.targetUserId).toBe("user-1");
    expect(audit.action).toBe(AuditAction.TICKET_PRIORITY_CHANGED);

    expect(audit.metadata).toEqual({
      ticketId: "ticket-1",
      previousPriority: TicketPriority.NORMAL,
      newPriority: TicketPriority.HIGH,
    });
  });

  it("should throw TicketNotFoundException when the ticket does not exist", async () => {
    ticketRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        ticketId: "ticket-1",
        priority: TicketPriority.HIGH,
      }),
    ).rejects.toBeInstanceOf(TicketNotFoundException);

    expect(ticketRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
