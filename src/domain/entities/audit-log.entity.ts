import { AuditAction } from "../enums/audit-action.enum";

export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly actorUserId: string,
    public readonly action: AuditAction,
    public readonly targetUserId: string | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}
}
