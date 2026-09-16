import { ListAdminTicketsUseCase } from "./list-admin-tickets.use-case";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { PageResult } from "@shared/pagination/page-query";

describe("ListAdminTicketsUseCase", () => {
  let useCase: ListAdminTicketsUseCase;

  const ticketRepository = {
    searchAdminTickets: jest.fn<
      Promise<PageResult<Ticket>>,
      [
        {
          status?: TicketStatus;
          priority?: TicketPriority;
          categoryId?: string;
          userId?: string;
          assignedToUserId?: string;
          createdAt?: Date;
          from?: Date;
          to?: Date;
        },
        {
          page: number;
          limit: number;
          sortBy: "createdAt" | "priority" | "status";
          sortDirection: "ASC" | "DESC";
        },
      ]
    >(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new ListAdminTicketsUseCase(
      ticketRepository as unknown as TicketRepository,
    );
  });

  it("should return admin tickets", async () => {
    const result: PageResult<Ticket> = {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };

    ticketRepository.searchAdminTickets.mockResolvedValue(result);

    const response = await useCase.execute({
      page: 1,
      limit: 20,
    });

    expect(response).toBe(result);

    expect(ticketRepository.searchAdminTickets).toHaveBeenCalledWith(
      {
        status: undefined,
        priority: undefined,
        categoryId: undefined,
        userId: undefined,
        assignedToUserId: undefined,
        createdAt: undefined,
        from: undefined,
        to: undefined,
      },
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });

  it("should pass all filters to the repository", async () => {
    const result: PageResult<Ticket> = {
      data: [],
      total: 0,
      page: 2,
      limit: 10,
      totalPages: 0,
    };

    const createdAt = new Date("2026-01-01");
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");

    ticketRepository.searchAdminTickets.mockResolvedValue(result);

    await useCase.execute({
      page: 2,
      limit: 10,
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      categoryId: "category-1",
      userId: "user-1",
      assignedToUserId: "admin-1",
      createdAt,
      from,
      to,
    });

    expect(ticketRepository.searchAdminTickets).toHaveBeenCalledWith(
      {
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.HIGH,
        categoryId: "category-1",
        userId: "user-1",
        assignedToUserId: "admin-1",
        createdAt,
        from,
        to,
      },
      {
        page: 2,
        limit: 10,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });

  it("should use the provided sorting options", async () => {
    const result: PageResult<Ticket> = {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };

    ticketRepository.searchAdminTickets.mockResolvedValue(result);

    await useCase.execute({
      page: 1,
      limit: 20,
      sortBy: "priority",
      sortDirection: "ASC",
    });

    expect(ticketRepository.searchAdminTickets).toHaveBeenCalledWith(
      expect.any(Object),
      {
        page: 1,
        limit: 20,
        sortBy: "priority",
        sortDirection: "ASC",
      },
    );
  });
});
