import { Injectable } from "@nestjs/common";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { TicketMessageRepository } from "@domain/repositories/ticket-message.repository";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { UserRepository } from "@domain/repositories/user.repository";
import {
  TicketAccessNotAllowedException,
  TicketNotFoundException,
} from "@domain/exceptions/domain.exception";

export interface GetTicketInput {
  userId: string;
  ticketId: string;
}

@Injectable()
export class GetTicketUseCase {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly ticketMessageRepository: TicketMessageRepository,
    private readonly ticketCategoryRepository: TicketCategoryRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: GetTicketInput): Promise<{
    ticket: Ticket;
    category: TicketCategory | null;
    assignedSupportUser: { id: string; email: string } | null;
    messages: TicketMessage[];
  }> {
    const ticket = await this.ticketRepository.findById(input.ticketId);
    if (!ticket) {
      throw new TicketNotFoundException();
    }

    if (ticket.userId !== input.userId) {
      throw new TicketAccessNotAllowedException();
    }

    const category = ticket.categoryId
      ? await this.ticketCategoryRepository.findById(ticket.categoryId)
      : null;

    const assignedSupportUser = ticket.assignedToUserId
      ? await this.userRepository.findById(ticket.assignedToUserId)
      : null;

    return {
      ticket,
      category,
      assignedSupportUser: assignedSupportUser
        ? { id: assignedSupportUser.id, email: assignedSupportUser.email }
        : null,
      messages: await this.ticketMessageRepository.findByTicketId(ticket.id),
    };
  }
}
