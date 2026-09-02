import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";

import {
  AuditLogInput,
  AuditLogger,
} from "../../application/interfaces/audit-logger.interface";
import { AuditLog } from "../../domain/entities/audit-log.entity";
import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";

@Injectable()
export class AuditLoggerService extends AuditLogger {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {
    super();
  }

  async log(input: AuditLogInput): Promise<void> {
    const log = AuditLog.create({
      actorUserId: input.actorUserId,
      action: input.action,
      targetUserId: input.targetUserId,
      metadata: input.metadata,
    });

    await this.auditLogRepository.create(log);

    this.logger.log(
      JSON.stringify({
        actorUserId: input.actorUserId,
        action: input.action,
        targetUserId: input.targetUserId,
        metadata: input.metadata,
      }),
    );
  }
}
