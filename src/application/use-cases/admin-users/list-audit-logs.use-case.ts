import { Injectable } from "@nestjs/common";

import { AuditAction } from "../../../domain/enums/audit-action.enum";
import {
  AuditLogFilters,
  AuditLogRepository,
} from "../../../domain/repositories/audit-log.repository";
import { AuditLog } from "../../../domain/entities/audit-log.entity";
import { PageQuery, PageResult } from "../../dtos/page-query.input";

export interface GetAuditLogsInput {
  action?: AuditAction;
  actorUserId?: string;
  targetUserId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class GetAuditLogsUseCase {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(
    input: GetAuditLogsInput,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<AuditLog>> {
    const filters: AuditLogFilters = {
      action: input.action,
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      from: input.from,
      to: input.to,
    };

    return this.auditLogRepository.findPage(filters, params);
  }
}
