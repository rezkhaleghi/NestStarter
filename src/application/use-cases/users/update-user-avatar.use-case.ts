import { Injectable } from "@nestjs/common";

import { User } from "@domain/entities/user.entity";
import { UserNotFoundException } from "@domain/exceptions/domain.exception";
import { UserRepository } from "@domain/repositories/user.repository";
import { FileStorage } from "@application/interfaces/file-storage.interface";
import { ImageProcessing } from "@application/interfaces/image-processing.interface";

@Injectable()
export class UpdateUserAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorage: FileStorage,
    private readonly imageProcessing: ImageProcessing,
  ) {}

  async execute(
    userId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
    },
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    /**
     * Process the uploaded image before storing it.
     *
     * The image-processing service:
     * - fixes EXIF orientation
     * - resizes the image to 512x512
     * - converts it to WebP
     * - compresses it with quality 85
     */
    const processedImage = await this.imageProcessing.processAvatar(
      file.buffer,
    );

    // Every user's avatar uses the same deterministic object path.
    const objectName = `avatars/${userId}/avatar.webp`;

    // Store the processed image before changing the database reference.
    await this.fileStorage.upload(objectName, processedImage, "image/webp");

    const oldAvatar = user.avatar;

    /**
     * Update the existing domain entity instead of constructing
     * a completely new User object just to change the avatar.
     */
    user.update({
      avatar: objectName,
    });

    /**
     * Save the database change only after the new file
     * has been successfully uploaded.
     *
     * The database reference is the source of truth. If this
     * save fails, the new object is cleaned up so the failed
     * operation does not leave an unnecessary file behind.
     */
    let saved: User;

    try {
      saved = await this.userRepository.save(user);
    } catch (error) {
      try {
        await this.fileStorage.delete(objectName);
      } catch {
        // Preserve the original database error.
      }

      throw error;
    }

    /**
     * Delete the old file only after the database update succeeds.
     *
     * If cleanup fails, keep the new database reference intact.
     * The old object becomes orphaned storage and can be cleaned up
     * separately; deleting the new object here would create a
     * broken database reference.
     */
    if (oldAvatar && oldAvatar !== objectName) {
      try {
        await this.fileStorage.delete(oldAvatar);
      } catch {
        // Preserve the successful database update.
      }
    }

    return saved;
  }
}
