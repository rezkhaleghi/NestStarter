import { UpdateTicketStatusUseCase } from "./update-ticket-status.use-case";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { TicketNotFoundException } from "@domain/exceptions/domain.exception";

describe("UpdateTicketStatusUseCase", () => {
  let useCase: UpdateTicketStatusUseCase;

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

    useCase = new UpdateTicketStatusUseCase(
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it("should update and save the ticket status", async () => {
    const ticket = Ticket.create({
      id: "ticket-1",
      userId: "user-1",
      subject: "Support request",
      status: TicketStatus.OPEN,
    });

    ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    ticketRepository.save.mockResolvedValue(ticket);

    await useCase.execute({
      actorUserId: "admin-1",
      ticketId: "ticket-1",
      status: TicketStatus.IN_PROGRESS,
    });

    expect(ticketRepository.findByIdForUpdate).toHaveBeenCalledWith("ticket-1");

    expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
    expect(ticketRepository.save).toHaveBeenCalledWith(ticket);
  });

  it("should create a status changed audit log", async () => {
    const ticket = Ticket.create({
      id: "ticket-1",
      userId: "user-1",
      subject: "Support request",
      status: TicketStatus.OPEN,
    });

    ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    ticketRepository.save.mockResolvedValue(ticket);

    await useCase.execute({
      actorUserId: "admin-1",
      ticketId: "ticket-1",
      status: TicketStatus.IN_PROGRESS,
    });

    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);

    const audit = auditLogRepository.create.mock.calls[0][0];

    expect(audit).toBeInstanceOf(AuditLog);
    expect(audit.actorUserId).toBe("admin-1");
    expect(audit.targetUserId).toBe("user-1");
    expect(audit.action).toBe(AuditAction.TICKET_STATUS_CHANGED);

    expect(audit.metadata).toEqual({
      ticketId: "ticket-1",
      previousStatus: TicketStatus.OPEN,
      newStatus: TicketStatus.IN_PROGRESS,
    });
  });

  it("should create both status changed and closed audit logs when closing the ticket", async () => {
    const ticket = Ticket.create({
      id: "ticket-1",
      userId: "user-1",
      subject: "Support request",
      status: TicketStatus.OPEN,
    });

    ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    ticketRepository.save.mockResolvedValue(ticket);

    await useCase.execute({
      actorUserId: "admin-1",
      ticketId: "ticket-1",
      status: TicketStatus.CLOSED,
    });

    expect(ticket.status).toBe(TicketStatus.CLOSED);
    expect(auditLogRepository.create).toHaveBeenCalledTimes(2);

    const statusAudit = auditLogRepository.create.mock.calls[0][0];
    const closedAudit = auditLogRepository.create.mock.calls[1][0];

    expect(statusAudit.action).toBe(AuditAction.TICKET_STATUS_CHANGED);
    expect(statusAudit.targetUserId).toBe("user-1");
    expect(statusAudit.metadata).toEqual({
      ticketId: "ticket-1",
      previousStatus: TicketStatus.OPEN,
      newStatus: TicketStatus.CLOSED,
    });

    expect(closedAudit.action).toBe(AuditAction.TICKET_CLOSED);
    expect(closedAudit.targetUserId).toBe("user-1");
    expect(closedAudit.metadata).toEqual({
      ticketId: "ticket-1",
    });
  });

  it("should throw TicketNotFoundException when the ticket does not exist", async () => {
    ticketRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        ticketId: "ticket-1",
        status: TicketStatus.IN_PROGRESS,
      }),
    ).rejects.toBeInstanceOf(TicketNotFoundException);

    expect(ticketRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("should propagate an invalid status transition", async () => {
    const ticket = Ticket.create({
      id: "ticket-1",
      userId: "user-1",
      subject: "Support request",
      status: TicketStatus.OPEN,
    });

    ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        ticketId: "ticket-1",
        status: TicketStatus.RESOLVED,
      }),
    ).rejects.toThrow();

    expect(ticketRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
