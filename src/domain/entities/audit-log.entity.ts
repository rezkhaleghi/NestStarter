import { randomUUID } from "crypto";
import { AuditAction } from "../enums/audit-action.enum";

export interface CreateAuditLogProps {
  id?: string;
  actorUserId: string;
  action: AuditAction;
  targetUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class AuditLog {
  private constructor(
    public readonly id: string,
    public readonly actorUserId: string,
    public readonly action: AuditAction,
    public readonly targetUserId: string | null,
    public readonly metadata: Record<string, unknown> | null,
  ) {}

  static create(props: CreateAuditLogProps): AuditLog {
    return new AuditLog(
      props.id ?? randomUUID(),
      props.actorUserId,
      props.action,
      props.targetUserId ?? null,
      props.metadata ?? null,
    );
  }
}
