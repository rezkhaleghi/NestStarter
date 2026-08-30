import { Injectable } from "@nestjs/common";
import { AuditLogger } from "../../interfaces/audit-logger.interface";
import {
  CannotDeleteSelfException,
  CannotRemoveLastAdminException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { AuditAction } from "@domain/enums/audit-action.enum";

@Injectable()
export class DeleteAdminUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogger: AuditLogger,
  ) {}

  async execute(id: string, requesterId: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundException();
    }

    if (id === requesterId) {
      throw new CannotDeleteSelfException();
    }

    const deleted = await this.userRepository.deleteAdminUser(id);

    if (!deleted) {
      throw new CannotRemoveLastAdminException();
    }

    await this.auditLogger.log({
      actorUserId: requesterId,
      targetUserId: id,
      action: AuditAction.USER_DELETED,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });
  }
}
