import { Injectable } from "@nestjs/common";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { TicketMessageRepository } from "@domain/repositories/ticket-message.repository";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { UserRepository } from "@domain/repositories/user.repository";

@Injectable()
export class GetAdminTicketUseCase {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly ticketMessageRepository: TicketMessageRepository,
    private readonly ticketCategoryRepository: TicketCategoryRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(ticketId: string): Promise<{
    ticket: Ticket;
    user: { id: string; email: string } | null;
    category: TicketCategory | null;
    assignedSupportUser: { id: string; email: string } | null;
    messages: TicketMessage[];
  }> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) throw new Error("Ticket not found.");

    const user = await this.userRepository.findById(ticket.userId);
    const category = ticket.categoryId
      ? await this.ticketCategoryRepository.findById(ticket.categoryId)
      : null;
    const assignedSupportUser = ticket.assignedToUserId
      ? await this.userRepository.findById(ticket.assignedToUserId)
      : null;

    return {
      ticket,
      user: user ? { id: user.id, email: user.email } : null,
      category,
      assignedSupportUser: assignedSupportUser
        ? { id: assignedSupportUser.id, email: assignedSupportUser.email }
        : null,
      messages: await this.ticketMessageRepository.findByTicketId(ticket.id),
    };
  }
}
