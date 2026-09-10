import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface UpdateTicketStatusInput {
  actorUserId: string;
  ticketId: string;
  status: TicketStatus;
}

@Injectable()
export class UpdateTicketStatusUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdateTicketStatusInput): Promise<void> {
    await this.unitOfWork.execute(
      async ({ ticketRepository, auditLogRepository }) => {
        const ticket = await ticketRepository.findByIdForUpdate(input.ticketId);
        if (!ticket) throw new Error("Ticket not found.");

        const previousStatus = ticket.status;
        ticket.setStatus(input.status);
        await ticketRepository.save(ticket);

        await auditLogRepository.create({
          id: randomUUID(),
          actorUserId: input.actorUserId,
          action: AuditAction.TICKET_STATUS_CHANGED,
          targetUserId: ticket.userId,
          metadata: {
            ticketId: ticket.id,
            previousStatus,
            newStatus: ticket.status,
          },
        } as any);

        if (ticket.status === TicketStatus.CLOSED) {
          await auditLogRepository.create({
            id: randomUUID(),
            actorUserId: input.actorUserId,
            action: AuditAction.TICKET_CLOSED,
            targetUserId: ticket.userId,
            metadata: { ticketId: ticket.id },
          } as any);
        }
      },
    );
  }
}
