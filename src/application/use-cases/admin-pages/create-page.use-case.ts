import { Injectable } from "@nestjs/common";

import { HtmlSanitizer } from "@application/interfaces/html-sanitizer.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { Page } from "@domain/entities/page.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { PageStatus } from "@domain/enums/page-status.enum";

export interface CreatePageInput {
  actorUserId: string;
  title: string;
  slug: string;
  content?: string;
  status?: PageStatus;
}

@Injectable()
export class CreatePageUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly htmlSanitizer: HtmlSanitizer,
  ) {}

  async execute(input: CreatePageInput): Promise<Page> {
    const content = this.htmlSanitizer.sanitize(input.content ?? "");

    return this.unitOfWork.execute(
      async ({ pageRepository, auditLogRepository }) => {
        const page = Page.create({
          title: input.title,
          slug: input.slug,
          content,
          status: input.status ?? PageStatus.DRAFT,
        });

        const saved = await pageRepository.create(page);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            action: AuditAction.PAGE_CREATED,
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
