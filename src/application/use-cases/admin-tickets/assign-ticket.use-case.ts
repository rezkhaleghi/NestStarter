import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { UserRole } from "@domain/enums/user-role.enum";
import {
  TicketMustAssignToAdminException,
  TicketNotFoundException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";
import { TicketRepository } from "@domain/repositories/ticket.repository";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface AssignTicketInput {
  actorUserId: string;
  ticketId: string;
  assignedToUserId: string | null;
}

@Injectable()
export class AssignTicketUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: AssignTicketInput): Promise<void> {
    await this.unitOfWork.execute(
      async ({ userRepository, ticketRepository, auditLogRepository }) => {
        const ticket = await ticketRepository.findByIdForUpdate(input.ticketId);
        if (!ticket) throw new TicketNotFoundException();

        if (input.assignedToUserId) {
          const targetUser = await userRepository.findById(
            input.assignedToUserId,
          );
          if (!targetUser) throw new UserNotFoundException();
          if (targetUser.role !== UserRole.ADMIN) {
            throw new TicketMustAssignToAdminException();
          }
        }

        ticket.assignTo(input.assignedToUserId);
        await ticketRepository.save(ticket);

        await auditLogRepository.create({
          id: randomUUID(),
          actorUserId: input.actorUserId,
          action: input.assignedToUserId
            ? AuditAction.TICKET_ASSIGNED
            : AuditAction.TICKET_UNASSIGNED,
          targetUserId: ticket.userId,
          metadata: {
            ticketId: ticket.id,
            assignedToUserId: input.assignedToUserId,
          },
        } as any);
      },
    );
  }
}
