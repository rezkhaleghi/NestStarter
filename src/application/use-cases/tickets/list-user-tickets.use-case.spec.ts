import { ListUserTicketsUseCase } from "./list-user-tickets.use-case";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketRepository } from "@domain/repositories/ticket.repository";

import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { PageResult } from "@shared/pagination/page-query";

describe("ListUserTicketsUseCase", () => {
  let useCase: ListUserTicketsUseCase;

  const ticketRepositoryMock = {
    findByUserId: jest.fn<
      Promise<PageResult<Ticket>>,
      [
        string,
        {
          page: number;
          limit: number;
          sortBy?: "createdAt" | "priority" | "status";
          sortDirection?: "ASC" | "DESC";
        },
        {
          status?: TicketStatus;
          priority?: TicketPriority;
          categoryId?: string;
        },
      ]
    >(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new ListUserTicketsUseCase(
      ticketRepositoryMock as unknown as TicketRepository,
    );
  });

  it("should list the user's tickets with pagination and filters", async () => {
    const result: PageResult<Ticket> = {
      data: [
        {
          id: "ticket-1",
        } as Ticket,
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    ticketRepositoryMock.findByUserId.mockResolvedValue(result);

    const input = {
      page: 1,
      limit: 10,
      sortBy: "createdAt" as const,
      sortDirection: "DESC" as const,
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      categoryId: "category-1",
    };

    const response = await useCase.execute("user-1", input);

    expect(response).toEqual(result);

    expect(ticketRepositoryMock.findByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
      {
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        categoryId: "category-1",
      },
    );
  });

  it("should pass undefined filters when they are not provided", async () => {
    const result: PageResult<Ticket> = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    ticketRepositoryMock.findByUserId.mockResolvedValue(result);

    const input = {
      page: 1,
      limit: 10,
      sortBy: "createdAt" as const,
      sortDirection: "ASC" as const,
    };

    const response = await useCase.execute("user-1", input);

    expect(response).toEqual(result);

    expect(ticketRepositoryMock.findByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortDirection: "ASC",
      },
      {
        status: undefined,
        priority: undefined,
        categoryId: undefined,
      },
    );
  });
});
