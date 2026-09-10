import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { Ticket } from "@domain/entities/ticket.entity";
import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { UserNotFoundException } from "@domain/exceptions/domain.exception";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface CreateTicketInput {
  userId: string;
  subject: string;
  categoryId?: string;
  priority?: TicketPriority;
  message: string;
}

@Injectable()
export class CreateTicketUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(
    input: CreateTicketInput,
  ): Promise<{ ticket: Ticket; message: TicketMessage }> {
    return this.unitOfWork.execute(
      async ({
        userRepository,
        ticketRepository,
        ticketMessageRepository,
        ticketCategoryRepository,
        auditLogRepository,
      }) => {
        const user = await userRepository.findById(input.userId);
        if (!user) throw new UserNotFoundException();

        if (input.categoryId) {
          const category = await ticketCategoryRepository.findById(
            input.categoryId,
          );
          if (!category || !category.isActive) {
            throw new Error("Ticket category not available.");
          }
        }

        const ticket = Ticket.create({
          id: randomUUID(),
          userId: input.userId,
          categoryId: input.categoryId ?? null,
          subject: input.subject,
          status: TicketStatus.OPEN,
          priority: input.priority ?? TicketPriority.NORMAL,
        });

        const createdTicket = await ticketRepository.create(ticket);

        const message = TicketMessage.create({
          id: randomUUID(),
          ticketId: createdTicket.id,
          senderUserId: input.userId,
          body: input.message,
        });

        const createdMessage = await ticketMessageRepository.create(message);

        await auditLogRepository.create({
          id: randomUUID(),
          actorUserId: input.userId,
          action: AuditAction.TICKET_CREATED,
          targetUserId: input.userId,
          metadata: {
            ticketId: createdTicket.id,
            categoryId: createdTicket.categoryId,
            subject: createdTicket.subject,
            status: createdTicket.status,
          },
        } as any);

        await auditLogRepository.create({
          id: randomUUID(),
          actorUserId: input.userId,
          action: AuditAction.TICKET_MESSAGE_CREATED,
          targetUserId: input.userId,
          metadata: {
            ticketId: createdTicket.id,
            messageId: createdMessage.id,
          },
        } as any);

        return { ticket: createdTicket, message: createdMessage };
      },
    );
  }
}
