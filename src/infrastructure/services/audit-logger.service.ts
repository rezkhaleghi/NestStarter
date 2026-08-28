import { Injectable, Logger } from "@nestjs/common";
import {
  AuditLogInput,
  AuditLogger,
} from "../../application/interfaces/audit-logger.interface";

@Injectable()
export class AuditLoggerService extends AuditLogger {
  private readonly logger = new Logger(AuditLoggerService.name);

  async log(input: AuditLogInput): Promise<void> {
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
