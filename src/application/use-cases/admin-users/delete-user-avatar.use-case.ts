import { Injectable } from "@nestjs/common";

import { User } from "../../../domain/entities/user.entity";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { FileStorage } from "../../interfaces/file-storage.interface";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { UnitOfWork } from "../../interfaces/unit-of-work.interface";

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
    private readonly unitOfWork: UnitOfWork,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(userId: string, actorUserId?: string): Promise<User> {
    let avatarKey: string | null = null;

    const saved = await this.unitOfWork.execute(
      async ({ userRepository, auditLogRepository }) => {
        // Load the target user from the repository.
        const user = await userRepository.findById(userId);

        // The target user must exist before modifying their avatar.
        if (!user) {
          throw new UserNotFoundException();
        }

        // Keep the storage key so it can be deleted after
        // the database transaction succeeds.
        avatarKey = user.avatar;

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
        const savedUser = await userRepository.save(user);

        // Record the administrative action for auditing.
        if (actorUserId) {
          await auditLogRepository.create(
            AuditLog.create({
              actorUserId,
              targetUserId: userId,
              action: AuditAction.USER_AVATAR_DELETED,
              metadata: {
                email: user.email,
                avatar: avatarKey,
              },
            }),
          );
        }

        return savedUser;
      },
    );

    // Delete the physical avatar only after the database
    // transaction has successfully committed.
    if (avatarKey) {
      await this.fileStorage.delete(avatarKey);
    }

    return saved;
  }
}
