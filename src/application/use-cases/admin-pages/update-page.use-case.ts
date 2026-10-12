import { Injectable } from "@nestjs/common";

import { HtmlSanitizer } from "@application/interfaces/html-sanitizer.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { Page } from "@domain/entities/page.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { PageNotFoundException } from "@domain/exceptions/domain.exception";
import { PageStatus } from "@domain/enums/page-status.enum";

export interface UpdatePageInput {
  actorUserId: string;
  id: string;
  title?: string;
  slug?: string;
  content?: string;
  status?: PageStatus;
}

@Injectable()
export class UpdatePageUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly htmlSanitizer: HtmlSanitizer,
  ) {}

  async execute(input: UpdatePageInput): Promise<Page> {
    const sanitizedContent =
      input.content === undefined
        ? undefined
        : this.htmlSanitizer.sanitize(input.content);

    return this.unitOfWork.execute(
      async ({ pageRepository, auditLogRepository }) => {
        const page = await pageRepository.findByIdForUpdate(input.id);

        if (!page) {
          throw new PageNotFoundException();
        }

        page.update({
          title: input.title,
          slug: input.slug,
          content: sanitizedContent,
          status: input.status,
        });

        const saved = await pageRepository.save(page);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            action: AuditAction.PAGE_UPDATED,
            targetUserId: null,
            metadata: {
              pageId: saved.id,
              slug: saved.slug,
              status: saved.status,
            },
          }),
        );

        return saved;
      },
    );
  }
}
