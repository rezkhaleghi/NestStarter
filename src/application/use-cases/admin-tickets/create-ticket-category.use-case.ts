import { Injectable } from "@nestjs/common";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

export interface CreateTicketCategoryInput {
  actorUserId: string;
  name: string;
  description?: string | null;
}

@Injectable()
export class CreateTicketCategoryUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreateTicketCategoryInput): Promise<TicketCategory> {
    return this.unitOfWork.execute(
      async ({ ticketCategoryRepository, auditLogRepository }) => {
        const category = TicketCategory.create({
          name: input.name,
          description: input.description,
          isActive: true,
        });

        const saved = await ticketCategoryRepository.create(category);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            targetUserId: null,
            action: AuditAction.TICKET_CATEGORY_CREATED,
            metadata: {
              categoryId: saved.id,
              name: saved.name,
            },
          }),
        );

        return saved;
      },
    );
  }
}
