import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { PageNotFoundException } from "@domain/exceptions/domain.exception";

@Injectable()
export class DeletePageUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: { actorUserId: string; id: string }): Promise<void> {
    await this.unitOfWork.execute(
      async ({ pageRepository, auditLogRepository }) => {
        const page = await pageRepository.findByIdForUpdate(input.id);

        if (!page) {
          throw new PageNotFoundException();
        }

        await pageRepository.deleteById(page.id);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            action: AuditAction.PAGE_DELETED,
            targetUserId: null,
            metadata: {
              pageId: page.id,
              slug: page.slug,
              status: page.status,
            },
          }),
        );
      },
    );
  }
}
