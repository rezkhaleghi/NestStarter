import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { TicketMessageRepository } from "@domain/repositories/ticket-message.repository";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface CreateTicketMessageInput {
  userId: string;
  ticketId: string;
  body: string;
}

@Injectable()
export class CreateTicketMessageUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreateTicketMessageInput): Promise<TicketMessage> {
    return this.unitOfWork.execute(
      async ({
        ticketRepository,
        ticketMessageRepository,
        auditLogRepository,
      }) => {
        const ticket = await ticketRepository.findByIdForUpdate(input.ticketId);
        if (!ticket) {
          throw new Error("Ticket not found.");
        }
        if (ticket.userId !== input.userId) {
          throw new Error("You cannot reply to this ticket.");
        }
        if (!ticket.canReceiveReply()) {
          throw new Error(
            "This ticket is closed and cannot receive new replies.",
          );
        }

        const message = TicketMessage.create({
          id: randomUUID(),
          ticketId: ticket.id,
          senderUserId: input.userId,
          body: input.body,
        });

        const savedMessage = await ticketMessageRepository.create(message);

        if (ticket.status === TicketStatus.WAITING_FOR_USER) {
          ticket.setStatus(TicketStatus.IN_PROGRESS);
          await ticketRepository.save(ticket);
        }

        await auditLogRepository.create({
          id: randomUUID(),
          actorUserId: input.userId,
          action: AuditAction.TICKET_MESSAGE_CREATED,
          targetUserId: input.userId,
          metadata: { ticketId: ticket.id, messageId: savedMessage.id },
        } as any);

        return savedMessage;
      },
    );
  }
}
