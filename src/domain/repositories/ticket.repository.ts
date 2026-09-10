import { Ticket } from "../entities/ticket.entity";
import { TicketPriority } from "../enums/ticket-priority.enum";
import { TicketStatus } from "../enums/ticket-status.enum";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export type TicketSortBy = "createdAt" | "priority" | "status";

export interface TicketSearchFilters {
  userId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  assignedToUserId?: string;
  createdAt?: Date;
  from?: Date;
  to?: Date;
}

export abstract class TicketRepository {
  abstract create(ticket: Ticket): Promise<Ticket>;
  abstract save(ticket: Ticket): Promise<Ticket>;
  abstract findById(id: string): Promise<Ticket | null>;
  abstract findByIdForUpdate(id: string): Promise<Ticket | null>;
  abstract findByUserId(
    userId: string,
    params: PageQuery<TicketSortBy>,
    filters?: TicketSearchFilters,
  ): Promise<PageResult<Ticket>>;
  abstract searchAdminTickets(
    filters: TicketSearchFilters,
    params: PageQuery<TicketSortBy>,
  ): Promise<PageResult<Ticket>>;
}
