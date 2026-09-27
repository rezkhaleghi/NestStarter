import { randomUUID } from "crypto";

import { AuditAction } from "../enums/audit-action.enum";

export interface CreateAuditLogProps {
  id?: string;
  actorUserId: string;
  action: AuditAction;
  targetUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface RestoreAuditLogProps {
  id: string;
  actorUserId: string;
  action: AuditAction;
  targetUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export class AuditLog {
  private constructor(
    public readonly id: string,
    public readonly actorUserId: string,
    public readonly action: AuditAction,
    public readonly targetUserId: string | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}

  /**
   * Creates a brand-new audit record.
   *
   * Audit logs are immutable, so there are intentionally no update methods.
   * The creation timestamp belongs to the domain object as part of its
   * historical identity.
   */
  static create(props: CreateAuditLogProps): AuditLog {
    return new AuditLog(
      props.id ?? randomUUID(),
      props.actorUserId,
      props.action,
      props.targetUserId ?? null,
      props.metadata ?? null,
      new Date(),
    );
  }

  /**
   * Restores an existing audit record from persistence.
   *
   * Persistence timestamps must never be regenerated when hydrating a
   * domain entity; otherwise historical audit ordering and date filtering
   * become unreliable.
   */
  static restore(props: RestoreAuditLogProps): AuditLog {
    return new AuditLog(
      props.id,
      props.actorUserId,
      props.action,
      props.targetUserId,
      props.metadata,
      props.createdAt,
    );
  }
}
