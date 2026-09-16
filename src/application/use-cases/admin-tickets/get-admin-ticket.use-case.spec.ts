import { describe, expect, it, jest } from "@jest/globals";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { User } from "@domain/entities/user.entity";
import { TicketNotFoundException } from "@domain/exceptions/domain.exception";
import { GetAdminTicketUseCase } from "./get-admin-ticket.use-case";

describe("GetAdminTicketUseCase", () => {
  it("returns ticket details with related data", async () => {
    const ticket = Ticket.create({
      id: "ticket-id",
      userId: "user-id",
      categoryId: "category-id",
      assignedToUserId: "admin-id",
      subject: "Test ticket",
    });

    const user = User.create({
      id: "user-id",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    const admin = User.create({
      id: "admin-id",
      email: "admin@example.com",
      hashedPassword: "hashed",
    });

    const category = TicketCategory.create({
      id: "category-id",
      name: "Technical",
    });

    const message = TicketMessage.create({
      id: "message-id",
      ticketId: "ticket-id",
      senderUserId: "user-id",
      body: "Hello",
    });

    const ticketRepository = {
      findById: jest.fn<(id: string) => Promise<Ticket | null>>(),
    };

    const ticketMessageRepository = {
      findByTicketId: jest.fn<(id: string) => Promise<TicketMessage[]>>(),
    };

    const ticketCategoryRepository = {
      findById: jest.fn<(id: string) => Promise<TicketCategory | null>>(),
    };

    const userRepository = {
      findById: jest.fn<(id: string) => Promise<User | null>>(),
    };

    ticketRepository.findById.mockResolvedValue(ticket);
    ticketMessageRepository.findByTicketId.mockResolvedValue([message]);
    ticketCategoryRepository.findById.mockResolvedValue(category);

    userRepository.findById
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(admin);

    const useCase = new GetAdminTicketUseCase(
      ticketRepository as any,
      ticketMessageRepository as any,
      ticketCategoryRepository as any,
      userRepository as any,
    );

    const result = await useCase.execute("ticket-id");

    expect(result.ticket).toBe(ticket);
    expect(result.user).toEqual({
      id: "user-id",
      email: "user@example.com",
    });
    expect(result.category).toBe(category);
    expect(result.assignedSupportUser).toEqual({
      id: "admin-id",
      email: "admin@example.com",
    });
    expect(result.messages).toEqual([message]);
  });

  it("returns null category and assignee when they are not set", async () => {
    const ticket = Ticket.create({
      id: "ticket-id",
      userId: "user-id",
      subject: "Test ticket",
    });

    const user = User.create({
      id: "user-id",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    const ticketRepository = {
      findById: jest.fn<(id: string) => Promise<Ticket | null>>(),
    };

    const ticketMessageRepository = {
      findByTicketId: jest.fn<(id: string) => Promise<TicketMessage[]>>(),
    };

    const ticketCategoryRepository = {
      findById: jest.fn<(id: string) => Promise<TicketCategory | null>>(),
    };

    const userRepository = {
      findById: jest.fn<(id: string) => Promise<User | null>>(),
    };

    ticketRepository.findById.mockResolvedValue(ticket);
    ticketMessageRepository.findByTicketId.mockResolvedValue([]);
    userRepository.findById.mockResolvedValue(user);

    const useCase = new GetAdminTicketUseCase(
      ticketRepository as any,
      ticketMessageRepository as any,
      ticketCategoryRepository as any,
      userRepository as any,
    );

    const result = await useCase.execute("ticket-id");

    expect(result.user).toEqual({
      id: "user-id",
      email: "user@example.com",
    });
    expect(result.category).toBeNull();
    expect(result.assignedSupportUser).toBeNull();
    expect(ticketCategoryRepository.findById).not.toHaveBeenCalled();
  });

  it("throws when the ticket does not exist", async () => {
    const ticketRepository = {
      findById: jest.fn<(id: string) => Promise<Ticket | null>>(),
    };

    const ticketMessageRepository = {
      findByTicketId: jest.fn<(id: string) => Promise<TicketMessage[]>>(),
    };

    const ticketCategoryRepository = {
      findById: jest.fn<(id: string) => Promise<TicketCategory | null>>(),
    };

    const userRepository = {
      findById: jest.fn<(id: string) => Promise<User | null>>(),
    };

    ticketRepository.findById.mockResolvedValue(null);

    const useCase = new GetAdminTicketUseCase(
      ticketRepository as any,
      ticketMessageRepository as any,
      ticketCategoryRepository as any,
      userRepository as any,
    );

    await expect(useCase.execute("ticket-id")).rejects.toBeInstanceOf(
      TicketNotFoundException,
    );
  });
});
