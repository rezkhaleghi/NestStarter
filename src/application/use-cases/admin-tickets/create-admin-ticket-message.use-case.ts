import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import {
  TicketClosedException,
  TicketNotFoundException,
} from "@domain/exceptions/domain.exception";

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
        if (!ticket) throw new TicketNotFoundException();
        if (!ticket.canReceiveReply()) {
          throw new TicketClosedException();
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
