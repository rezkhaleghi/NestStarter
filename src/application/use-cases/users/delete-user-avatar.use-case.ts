import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { FileStorage } from "../../interfaces/file-storage.interface";
import { User } from "../../../domain/entities/user.entity";

@Injectable()
export class DeleteUserAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    // Keep the old avatar path so the physical file can be deleted
    // after the database update succeeds.
    const oldAvatar = user.avatar;

    /**
     * Clear the avatar reference on the existing domain entity.
     *
     * `null` explicitly means that the user no longer has an avatar.
     */
    user.update({
      avatar: null,
    });

    /**
     * Update the database first.
     *
     * This ensures the database no longer references the old file
     * before we remove it from physical storage.
     */
    const saved = await this.userRepository.save(user);

    /**
     * Delete the old physical file only after the database update succeeds.
     *
     * If storage deletion fails, the database remains consistent and
     * simply contains no reference to the old avatar.
     */
    if (oldAvatar) {
      await this.fileStorage.delete(oldAvatar);
    }

    return saved;
  }
}
