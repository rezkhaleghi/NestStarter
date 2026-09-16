import { Injectable } from "@nestjs/common";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { UserRole } from "@domain/enums/user-role.enum";
import {
  TicketMustAssignToAdminException,
  TicketNotFoundException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { UserStatus } from "@domain/enums/user-status.enum";
import { AuditLog } from "@domain/entities/audit-log.entity";

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
          if (
            targetUser.role !== UserRole.ADMIN ||
            targetUser.status !== UserStatus.ACTIVE
          ) {
            throw new TicketMustAssignToAdminException();
          }
        }

        ticket.assignTo(input.assignedToUserId);
        await ticketRepository.save(ticket);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            action: input.assignedToUserId
              ? AuditAction.TICKET_ASSIGNED
              : AuditAction.TICKET_UNASSIGNED,
            targetUserId: ticket.userId,
            metadata: {
              ticketId: ticket.id,
              assignedToUserId: input.assignedToUserId,
            },
          }),
        );
      },
    );
  }
}
