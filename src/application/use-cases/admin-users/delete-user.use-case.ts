import { Injectable } from "@nestjs/common";

import {
  CannotDeleteSelfException,
  CannotRemoveLastAdminException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { UnitOfWork } from "../../interfaces/unit-of-work.interface";

@Injectable()
export class DeleteAdminUserUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(id: string, requesterId: string): Promise<void> {
    return this.unitOfWork.execute(
      async ({ userRepository, auditLogRepository }) => {
        const user = await userRepository.findById(id);

        if (!user) {
          throw new UserNotFoundException();
        }

        if (id === requesterId) {
          throw new CannotDeleteSelfException();
        }

        const deleted = await userRepository.deleteAdminUser(id);

        if (!deleted) {
          throw new CannotRemoveLastAdminException();
        }

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: requesterId,
            targetUserId: id,
            action: AuditAction.USER_DELETED,
            metadata: {
              email: user.email,
              role: user.role,
            },
          }),
        );
      },
    );
  }
}
