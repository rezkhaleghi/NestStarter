import { Injectable } from "@nestjs/common";

import { TicketCategoryNotFoundException } from "@domain/exceptions/domain.exception";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
export interface DeactivateTicketCategoryInput {
  actorUserId: string;
  id: string;
}
@Injectable()
export class DeactivateTicketCategoryUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: DeactivateTicketCategoryInput): Promise<void> {
    await this.unitOfWork.execute(
      async ({ ticketCategoryRepository, auditLogRepository }) => {
        const category = await ticketCategoryRepository.findByIdForUpdate(
          input.id,
        );

        if (!category) {
          throw new TicketCategoryNotFoundException();
        }

        category.deactivate();

        const saved = await ticketCategoryRepository.save(category);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            targetUserId: null,
            action: AuditAction.TICKET_CATEGORY_DEACTIVATED,
            metadata: {
              categoryId: saved.id,
              name: saved.name,
            },
          }),
        );
      },
    );
  }
}
