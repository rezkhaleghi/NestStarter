import { Injectable } from "@nestjs/common";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export interface ListAdminTicketsInput extends PageQuery<
  "createdAt" | "priority" | "status"
> {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  userId?: string;
  assignedToUserId?: string;
  createdAt?: Date;
  from?: Date;
  to?: Date;
}

@Injectable()
export class ListAdminTicketsUseCase {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(input: ListAdminTicketsInput): Promise<PageResult<Ticket>> {
    return this.ticketRepository.searchAdminTickets(
      {
        status: input.status,
        priority: input.priority,
        categoryId: input.categoryId,
        userId: input.userId,
        assignedToUserId: input.assignedToUserId,
        createdAt: input.createdAt,
        from: input.from,
        to: input.to,
      },
      {
        page: input.page,
        limit: input.limit,
        sortBy: input.sortBy ?? "createdAt",
        sortDirection: input.sortDirection ?? "DESC",
      },
    );
  }
}
