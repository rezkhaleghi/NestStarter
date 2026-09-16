import { GetTicketUseCase } from "./get-ticket.use-case";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { User } from "@domain/entities/user.entity";

import { TicketRepository } from "@domain/repositories/ticket.repository";
import { TicketMessageRepository } from "@domain/repositories/ticket-message.repository";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { UserRepository } from "@domain/repositories/user.repository";

import { TicketNotFoundException } from "@domain/exceptions/domain.exception";

describe("GetTicketUseCase", () => {
  let useCase: GetTicketUseCase;

  const ticketRepositoryMock = {
    findByUserIdAndId: jest.fn<Promise<Ticket | null>, [string, string]>(),
  };

  const ticketMessageRepositoryMock = {
    findByTicketId: jest.fn<Promise<TicketMessage[]>, [string]>(),
  };

  const ticketCategoryRepositoryMock = {
    findById: jest.fn<Promise<TicketCategory | null>, [string]>(),
  };

  const userRepositoryMock = {
    findById: jest.fn<Promise<User | null>, [string]>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new GetTicketUseCase(
      ticketRepositoryMock as unknown as TicketRepository,
      ticketMessageRepositoryMock as unknown as TicketMessageRepository,
      ticketCategoryRepositoryMock as unknown as TicketCategoryRepository,
      userRepositoryMock as unknown as UserRepository,
    );
  });

  it("should return ticket, category, assigned support user, and messages", async () => {
    const ticket = {
      id: "ticket-1",
      userId: "user-1",
      categoryId: "category-1",
      assignedToUserId: "support-1",
    } as Ticket;

    const category = {
      id: "category-1",
    } as TicketCategory;

    const supportUser = {
      id: "support-1",
      email: "support@example.com",
    } as User;

    const messages = [
      {
        id: "message-1",
        ticketId: "ticket-1",
      } as TicketMessage,
    ];

    ticketRepositoryMock.findByUserIdAndId.mockResolvedValue(ticket);
    ticketCategoryRepositoryMock.findById.mockResolvedValue(category);
    userRepositoryMock.findById.mockResolvedValue(supportUser);
    ticketMessageRepositoryMock.findByTicketId.mockResolvedValue(messages);

    const result = await useCase.execute({
      userId: "user-1",
      ticketId: "ticket-1",
    });

    expect(result).toEqual({
      ticket,
      category,
      assignedSupportUser: {
        id: "support-1",
        email: "support@example.com",
      },
      messages,
    });

    expect(ticketRepositoryMock.findByUserIdAndId).toHaveBeenCalledWith(
      "user-1",
      "ticket-1",
    );

    expect(ticketCategoryRepositoryMock.findById).toHaveBeenCalledWith(
      "category-1",
    );

    expect(userRepositoryMock.findById).toHaveBeenCalledWith("support-1");

    expect(ticketMessageRepositoryMock.findByTicketId).toHaveBeenCalledWith(
      "ticket-1",
    );
  });

  it("should return null category when ticket has no category", async () => {
    const ticket = {
      id: "ticket-1",
      userId: "user-1",
      categoryId: null,
      assignedToUserId: null,
    } as Ticket;

    const messages: TicketMessage[] = [];

    ticketRepositoryMock.findByUserIdAndId.mockResolvedValue(ticket);
    ticketMessageRepositoryMock.findByTicketId.mockResolvedValue(messages);

    const result = await useCase.execute({
      userId: "user-1",
      ticketId: "ticket-1",
    });

    expect(result).toEqual({
      ticket,
      category: null,
      assignedSupportUser: null,
      messages,
    });

    expect(ticketCategoryRepositoryMock.findById).not.toHaveBeenCalled();
    expect(userRepositoryMock.findById).not.toHaveBeenCalled();
  });

  it("should return null assigned support user when ticket is not assigned", async () => {
    const ticket = {
      id: "ticket-1",
      userId: "user-1",
      categoryId: "category-1",
      assignedToUserId: null,
    } as Ticket;

    const category = {
      id: "category-1",
    } as TicketCategory;

    ticketRepositoryMock.findByUserIdAndId.mockResolvedValue(ticket);
    ticketCategoryRepositoryMock.findById.mockResolvedValue(category);
    ticketMessageRepositoryMock.findByTicketId.mockResolvedValue([]);

    const result = await useCase.execute({
      userId: "user-1",
      ticketId: "ticket-1",
    });

    expect(result.assignedSupportUser).toBeNull();
    expect(userRepositoryMock.findById).not.toHaveBeenCalled();
  });

  it("should throw when the ticket does not belong to the user or does not exist", async () => {
    ticketRepositoryMock.findByUserIdAndId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        ticketId: "ticket-1",
      }),
    ).rejects.toBeInstanceOf(TicketNotFoundException);

    expect(ticketCategoryRepositoryMock.findById).not.toHaveBeenCalled();
    expect(userRepositoryMock.findById).not.toHaveBeenCalled();
    expect(ticketMessageRepositoryMock.findByTicketId).not.toHaveBeenCalled();
  });
});
