import { Injectable } from "@nestjs/common";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketCategoryNotFoundException } from "@domain/exceptions/domain.exception";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

export interface UpdateTicketCategoryInput {
  actorUserId: string;
  id: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

@Injectable()
export class UpdateTicketCategoryUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdateTicketCategoryInput): Promise<TicketCategory> {
    return this.unitOfWork.execute(
      async ({ ticketCategoryRepository, auditLogRepository }) => {
        const category = await ticketCategoryRepository.findByIdForUpdate(
          input.id,
        );
        if (!category) {
          throw new TicketCategoryNotFoundException();
        }

        const previous = {
          name: category.name,
          description: category.description,
          isActive: category.isActive,
        };

        category.update({
          name: input.name,
          description: input.description,
          isActive: input.isActive,
        });

        const saved = await ticketCategoryRepository.save(category);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            targetUserId: null,
            action: AuditAction.TICKET_CATEGORY_UPDATED,
            metadata: {
              categoryId: saved.id,
              previous,
              current: {
                name: saved.name,
                description: saved.description,
                isActive: saved.isActive,
              },
            },
          }),
        );

        return saved;
      },
    );
  }
}
