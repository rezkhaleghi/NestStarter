import { AuditAction } from "../../domain/enums/audit-action.enum";

export interface AuditLogInput {
  actorUserId: string;
  action: AuditAction;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
}

export abstract class AuditLogger {
  abstract log(input: AuditLogInput): Promise<void>;
}
