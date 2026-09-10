import { Injectable } from "@nestjs/common";

import { TicketRepository } from "@domain/repositories/ticket.repository";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";
import { Ticket } from "@domain/entities/ticket.entity";
import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";

export interface ListUserTicketsInput extends PageQuery<
  "createdAt" | "priority" | "status"
> {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
}

@Injectable()
export class ListUserTicketsUseCase {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(
    userId: string,
    input: ListUserTicketsInput,
  ): Promise<PageResult<Ticket>> {
    return this.ticketRepository.findByUserId(
      userId,
      {
        page: input.page,
        limit: input.limit,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
      },
      {
        status: input.status,
        priority: input.priority,
        categoryId: input.categoryId,
      },
    );
  }
}
