import { CreateTicketUseCase } from "./create-ticket.use-case";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { TicketCategory } from "@domain/entities/ticket-category.entity";

import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  TicketCategoryNotFoundException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("CreateTicketUseCase", () => {
  let useCase: CreateTicketUseCase;

  const userRepositoryMock = {
    findById: jest.fn<Promise<any>, [string]>(),
  };

  const ticketRepositoryMock = {
    create: jest.fn<Promise<Ticket>, [Ticket]>(),
  };

  const ticketMessageRepositoryMock = {
    create: jest.fn<Promise<TicketMessage>, [TicketMessage]>(),
  };

  const ticketCategoryRepositoryMock = {
    findById: jest.fn<Promise<TicketCategory | null>, [string]>(),
  };

  const auditLogRepositoryMock = {
    create: jest.fn<Promise<AuditLog>, [AuditLog]>(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation(async (callback: any) =>
      callback({
        userRepository: userRepositoryMock,
        ticketRepository: ticketRepositoryMock,
        ticketMessageRepository: ticketMessageRepositoryMock,
        ticketCategoryRepository: ticketCategoryRepositoryMock,
        auditLogRepository: auditLogRepositoryMock,
      }),
    );

    useCase = new CreateTicketUseCase(unitOfWorkMock as unknown as UnitOfWork);
  });

  it("should create a ticket, message, and audit logs", async () => {
    const userId = "user-1";

    const user = {
      id: userId,
    };

    const createdTicket = {
      id: "ticket-1",
      userId,
      categoryId: null,
      subject: "My issue",
      status: TicketStatus.OPEN,
      priority: TicketPriority.NORMAL,
    } as Ticket;

    const createdMessage = {
      id: "message-1",
      ticketId: "ticket-1",
      senderUserId: userId,
      body: "Something is wrong",
    } as TicketMessage;

    userRepositoryMock.findById.mockResolvedValue(user);

    ticketRepositoryMock.create.mockResolvedValue(createdTicket);

    ticketMessageRepositoryMock.create.mockResolvedValue(createdMessage);

    auditLogRepositoryMock.create.mockImplementation(
      async (auditLog: AuditLog) => auditLog,
    );

    const result = await useCase.execute({
      userId,
      subject: "My issue",
      message: "Something is wrong",
    });

    expect(result).toEqual({
      ticket: createdTicket,
      message: createdMessage,
    });

    expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);

    expect(ticketRepositoryMock.create).toHaveBeenCalledTimes(1);

    const ticketArgument = ticketRepositoryMock.create.mock.calls[0][0];

    expect(ticketArgument.userId).toBe(userId);
    expect(ticketArgument.subject).toBe("My issue");
    expect(ticketArgument.status).toBe(TicketStatus.OPEN);
    expect(ticketArgument.priority).toBe(TicketPriority.NORMAL);
    expect(ticketArgument.categoryId).toBeNull();

    expect(ticketMessageRepositoryMock.create).toHaveBeenCalledTimes(1);

    const messageArgument = ticketMessageRepositoryMock.create.mock.calls[0][0];

    expect(messageArgument.ticketId).toBe(createdTicket.id);
    expect(messageArgument.senderUserId).toBe(userId);
    expect(messageArgument.body).toBe("Something is wrong");

    expect(auditLogRepositoryMock.create).toHaveBeenCalledTimes(2);

    expect(auditLogRepositoryMock.create.mock.calls[0][0].action).toBe(
      AuditAction.TICKET_CREATED,
    );

    expect(auditLogRepositoryMock.create.mock.calls[1][0].action).toBe(
      AuditAction.TICKET_MESSAGE_CREATED,
    );
  });

  it("should use the provided category and priority", async () => {
    const categoryId = "category-1";

    const category = {
      id: categoryId,
      isActive: true,
    } as TicketCategory;

    const createdTicket = {
      id: "ticket-1",
      categoryId,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
    } as Ticket;

    const createdMessage = {
      id: "message-1",
      ticketId: "ticket-1",
    } as TicketMessage;

    userRepositoryMock.findById.mockResolvedValue({
      id: "user-1",
    });

    ticketCategoryRepositoryMock.findById.mockResolvedValue(category);
    ticketRepositoryMock.create.mockResolvedValue(createdTicket);
    ticketMessageRepositoryMock.create.mockResolvedValue(createdMessage);

    const result = await useCase.execute({
      userId: "user-1",
      subject: "Important issue",
      categoryId,
      priority: TicketPriority.HIGH,
      message: "Please help",
    });

    expect(ticketCategoryRepositoryMock.findById).toHaveBeenCalledWith(
      categoryId,
    );

    expect(result.ticket).toBe(createdTicket);
  });

  it("should throw when user does not exist", async () => {
    userRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "missing-user",
        subject: "Issue",
        message: "Help",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
    expect(ticketMessageRepositoryMock.create).not.toHaveBeenCalled();
    expect(auditLogRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("should throw when the category does not exist", async () => {
    userRepositoryMock.findById.mockResolvedValue({
      id: "user-1",
    });

    ticketCategoryRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        subject: "Issue",
        categoryId: "missing-category",
        message: "Help",
      }),
    ).rejects.toBeInstanceOf(TicketCategoryNotFoundException);

    expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("should throw when the category is inactive", async () => {
    userRepositoryMock.findById.mockResolvedValue({
      id: "user-1",
    });

    ticketCategoryRepositoryMock.findById.mockResolvedValue({
      id: "category-1",
      isActive: false,
    } as TicketCategory);

    await expect(
      useCase.execute({
        userId: "user-1",
        subject: "Issue",
        categoryId: "category-1",
        message: "Help",
      }),
    ).rejects.toBeInstanceOf(TicketCategoryNotFoundException);

    expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
  });
});
