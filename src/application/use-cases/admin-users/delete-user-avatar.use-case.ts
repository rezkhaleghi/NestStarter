import { Injectable } from "@nestjs/common";
import { User } from "../../../domain/entities/user.entity";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { FileStorage } from "../../interfaces/file-storage.interface";
import {
  AuditAction,
  AuditLogger,
} from "../../interfaces/audit-logger.interface";

/**
 * Application use case for deleting another user's avatar as an administrator.
 *
 * Responsibilities:
 * - Load the target user.
 * - Delete the avatar file from storage.
 * - Update the user's domain state.
 * - Persist the changed user.
 * - Write an audit log for the administrative action.
 *
 * The use case coordinates the operation between the domain
 * and infrastructure. Business behavior belongs to the User entity.
 */
@Injectable()
export class DeleteAdminUserAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorage: FileStorage,
    private readonly auditLogger: AuditLogger,
  ) {}

  async execute(userId: string, actorUserId?: string): Promise<User> {
    // Load the target user from the repository.
    const user = await this.userRepository.findById(userId);

    // The target user must exist before modifying their avatar.
    if (!user) {
      throw new UserNotFoundException();
    }

    // Delete the physical avatar from object storage if one exists.
    if (user.avatar) {
      await this.fileStorage.delete(user.avatar);
    }

    // Business operation with rules/invariants.
    //
    // Clear the avatar from the domain entity.
    // We mutate the existing entity instead of reconstructing
    // the entire User object just to change one field.
    user.update({
      avatar: null,
    });

    // Persist the mutated domain entity.
    //
    // The repository handles mapping the domain entity
    // to the persistence model and saving it to the database.
    const saved = await this.userRepository.save(user);

    // Record the administrative action for auditing.
    if (actorUserId) {
      await this.auditLogger.log({
        actorUserId,
        targetUserId: userId,
        action: AuditAction.USER_AVATAR_DELETED,
        metadata: {
          email: user.email,
        },
      });
    }

    return saved;
  }
}
