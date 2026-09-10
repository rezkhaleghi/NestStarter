import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { TicketMessageRepository } from "@domain/repositories/ticket-message.repository";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface CreateAdminTicketMessageInput {
  actorUserId: string;
  ticketId: string;
  body: string;
}

@Injectable()
export class CreateAdminTicketMessageUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreateAdminTicketMessageInput): Promise<TicketMessage> {
    return this.unitOfWork.execute(
      async ({
        ticketRepository,
        ticketMessageRepository,
        auditLogRepository,
      }) => {
        const ticket = await ticketRepository.findByIdForUpdate(input.ticketId);
        if (!ticket) throw new Error("Ticket not found.");
        if (!ticket.canReceiveReply()) {
          throw new Error(
            "This ticket is closed and cannot receive new replies.",
          );
        }

        const message = TicketMessage.create({
          id: randomUUID(),
          ticketId: ticket.id,
          senderUserId: input.actorUserId,
          body: input.body,
        });

        const saved = await ticketMessageRepository.create(message);

        if (
          ticket.status === TicketStatus.OPEN ||
          ticket.status === TicketStatus.WAITING_FOR_SUPPORT
        ) {
          ticket.setStatus(TicketStatus.IN_PROGRESS);
          await ticketRepository.save(ticket);
        }

        await auditLogRepository.create({
          id: randomUUID(),
          actorUserId: input.actorUserId,
          action: AuditAction.TICKET_MESSAGE_CREATED,
          targetUserId: ticket.userId,
          metadata: { ticketId: ticket.id, messageId: saved.id },
        } as any);

        return saved;
      },
    );
  }
}
