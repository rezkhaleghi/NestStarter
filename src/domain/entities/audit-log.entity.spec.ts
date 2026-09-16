import { AuditLog } from "./audit-log.entity";
import { AuditAction } from "../enums/audit-action.enum";

describe("AuditLog", () => {
  it("creates an audit log with generated id and default optional values", () => {
    const log = AuditLog.create({
      actorUserId: "user-1",
      action: AuditAction.USER_CREATED,
    });

    expect(log.id).toBeDefined();
    expect(log.actorUserId).toBe("user-1");
    expect(log.action).toBe(AuditAction.USER_CREATED);
    expect(log.targetUserId).toBeNull();
    expect(log.metadata).toBeNull();
  });

  it("preserves provided id and target user", () => {
    const log = AuditLog.create({
      id: "audit-1",
      actorUserId: "admin-1",
      action: AuditAction.USER_UPDATED,
      targetUserId: "user-1",
    });

    expect(log.id).toBe("audit-1");
    expect(log.actorUserId).toBe("admin-1");
    expect(log.action).toBe(AuditAction.USER_UPDATED);
    expect(log.targetUserId).toBe("user-1");
  });

  it("preserves metadata", () => {
    const metadata = {
      email: "user@example.com",
      role: "ADMIN",
      changes: {
        status: "ACTIVE",
      },
    };

    const log = AuditLog.create({
      actorUserId: "admin-1",
      action: AuditAction.USER_UPDATED,
      metadata,
    });

    expect(log.metadata).toEqual(metadata);
  });

  it("preserves explicit null values", () => {
    const log = AuditLog.create({
      actorUserId: "admin-1",
      action: AuditAction.USER_DELETED,
      targetUserId: null,
      metadata: null,
    });

    expect(log.targetUserId).toBeNull();
    expect(log.metadata).toBeNull();
  });
});
