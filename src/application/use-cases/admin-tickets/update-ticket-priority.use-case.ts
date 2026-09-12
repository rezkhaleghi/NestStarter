import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { TicketNotFoundException } from "@domain/exceptions/domain.exception";

export interface UpdateTicketPriorityInput {
  actorUserId: string;
  ticketId: string;
  priority: TicketPriority;
}

@Injectable()
export class UpdateTicketPriorityUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdateTicketPriorityInput): Promise<void> {
    await this.unitOfWork.execute(
      async ({ ticketRepository, auditLogRepository }) => {
        const ticket = await ticketRepository.findByIdForUpdate(input.ticketId);
        if (!ticket) throw new TicketNotFoundException();

        const previousPriority = ticket.priority;
        ticket.setPriority(input.priority);
        await ticketRepository.save(ticket);

        await auditLogRepository.create({
          id: randomUUID(),
          actorUserId: input.actorUserId,
          action: AuditAction.TICKET_PRIORITY_CHANGED,
          targetUserId: ticket.userId,
          metadata: {
            ticketId: ticket.id,
            previousPriority,
            newPriority: ticket.priority,
          },
        } as any);
      },
    );
  }
}
