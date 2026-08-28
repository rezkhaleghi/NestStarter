import { Injectable, Logger } from "@nestjs/common";

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
  private readonly logger = new Logger(GetAuditLogsUseCase.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(
    input: GetAuditLogsInput,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<AuditLog>> {
    try {
      const filters: AuditLogFilters = {
        action: input.action,
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        from: input.from,
        to: input.to,
      };

      this.logger.debug(
        `Getting audit logs: ${JSON.stringify({
          filters,
          params,
        })}`,
      );

      return await this.auditLogRepository.findPage(filters, params);
    } catch (error) {
      this.logger.error(
        "Failed to get audit logs",
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }
}
