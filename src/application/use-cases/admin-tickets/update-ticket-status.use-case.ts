import { Injectable } from "@nestjs/common";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { TicketNotFoundException } from "@domain/exceptions/domain.exception";
import { AuditLog } from "@domain/entities/audit-log.entity";

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
        if (!ticket) throw new TicketNotFoundException();

        const previousStatus = ticket.status;
        ticket.setStatus(input.status);
        await ticketRepository.save(ticket);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            action: AuditAction.TICKET_STATUS_CHANGED,
            targetUserId: ticket.userId,
            metadata: {
              ticketId: ticket.id,
              previousStatus,
              newStatus: ticket.status,
            },
          }),
        );

        if (ticket.status === TicketStatus.CLOSED) {
          await auditLogRepository.create(
            AuditLog.create({
              actorUserId: input.actorUserId,
              action: AuditAction.TICKET_CLOSED,
              targetUserId: ticket.userId,
              metadata: {
                ticketId: ticket.id,
              },
            }),
          );
        }
      },
    );
  }
}
