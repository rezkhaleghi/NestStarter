import { describe, expect, it, jest } from "@jest/globals";

import { Ticket } from "@domain/entities/ticket.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import {
  TicketClosedException,
  TicketNotFoundException,
} from "@domain/exceptions/domain.exception";
import { CreateAdminTicketMessageUseCase } from "./create-admin-ticket-message.use-case";

describe("CreateAdminTicketMessageUseCase", () => {
  const createRepositories = () => ({
    ticketRepository: {
      findByIdForUpdate: jest.fn<(id: string) => Promise<Ticket | null>>(),
      save: jest.fn<(ticket: Ticket) => Promise<Ticket>>(),
    },
    ticketMessageRepository: {
      create: jest.fn<(message: any) => Promise<any>>(),
    },
    auditLogRepository: {
      create: jest.fn<(audit: unknown) => Promise<void>>(),
    },
  });

  const createUnitOfWork = (
    repositories: ReturnType<typeof createRepositories>,
  ) => ({
    execute: jest.fn(async (work: any) => work(repositories)),
  });

  it("creates a message and moves OPEN ticket to IN_PROGRESS", async () => {
    const ticket = Ticket.create({
      id: "ticket-id",
      userId: "user-id",
      subject: "Test ticket",
      status: TicketStatus.OPEN,
    });

    const savedMessage = {
      id: "message-id",
      ticketId: "ticket-id",
      senderUserId: "admin-id",
      body: "Hello",
    };

    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    repositories.ticketMessageRepository.create.mockResolvedValue(savedMessage);
    repositories.ticketRepository.save.mockResolvedValue(ticket);

    const unitOfWork = createUnitOfWork(repositories);

    const result = await new CreateAdminTicketMessageUseCase(
      unitOfWork as any,
    ).execute({
      actorUserId: "admin-id",
      ticketId: "ticket-id",
      body: "Hello",
    });

    expect(result).toBe(savedMessage);
    expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
    expect(repositories.ticketRepository.save).toHaveBeenCalledWith(ticket);

    const audit = repositories.auditLogRepository.create.mock.calls[0][0] as {
      action: AuditAction;
    };

    expect(audit.action).toBe(AuditAction.TICKET_MESSAGE_CREATED);
  });

  it("creates a message without changing IN_PROGRESS status", async () => {
    const ticket = Ticket.create({
      id: "ticket-id",
      userId: "user-id",
      subject: "Test ticket",
      status: TicketStatus.IN_PROGRESS,
    });

    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    repositories.ticketMessageRepository.create.mockResolvedValue({
      id: "message-id",
      ticketId: "ticket-id",
      senderUserId: "admin-id",
      body: "Reply",
    });

    const unitOfWork = createUnitOfWork(repositories);

    await new CreateAdminTicketMessageUseCase(unitOfWork as any).execute({
      actorUserId: "admin-id",
      ticketId: "ticket-id",
      body: "Reply",
    });

    expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
    expect(repositories.ticketRepository.save).not.toHaveBeenCalled();
  });

  it("throws when the ticket does not exist", async () => {
    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(null);

    const unitOfWork = createUnitOfWork(repositories);

    await expect(
      new CreateAdminTicketMessageUseCase(unitOfWork as any).execute({
        actorUserId: "admin-id",
        ticketId: "ticket-id",
        body: "Hello",
      }),
    ).rejects.toBeInstanceOf(TicketNotFoundException);
  });

  it("throws when the ticket is closed", async () => {
    const ticket = Ticket.create({
      id: "ticket-id",
      userId: "user-id",
      subject: "Closed ticket",
      status: TicketStatus.CLOSED,
    });

    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);

    const unitOfWork = createUnitOfWork(repositories);

    await expect(
      new CreateAdminTicketMessageUseCase(unitOfWork as any).execute({
        actorUserId: "admin-id",
        ticketId: "ticket-id",
        body: "Hello",
      }),
    ).rejects.toBeInstanceOf(TicketClosedException);

    expect(repositories.ticketMessageRepository.create).not.toHaveBeenCalled();
  });
});
