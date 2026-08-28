export enum AuditAction {
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED",
  USER_AVATAR_DELETED = "USER_AVATAR_DELETED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
}

export interface AuditLogInput {
  actorUserId: string;
  action: AuditAction;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
}

export abstract class AuditLogger {
  abstract log(input: AuditLogInput): Promise<void>;
}
