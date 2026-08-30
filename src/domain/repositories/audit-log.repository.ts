import { PageQuery, PageResult } from "src/shared/pagination/page-query";
import { AuditLog } from "../entities/audit-log.entity";
import { AuditAction } from "../enums/audit-action.enum";

export interface AuditLogFilters {
  action?: AuditAction;
  actorUserId?: string;
  targetUserId?: string;
  from?: Date;
  to?: Date;
}

export abstract class AuditLogRepository {
  abstract create(log: AuditLog): Promise<AuditLog>;

  abstract findPage(
    filters: AuditLogFilters,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<AuditLog>>;
}
