import { Injectable } from "@nestjs/common";

import { User } from "../../../domain/entities/user.entity";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { FileStorage } from "../../interfaces/file-storage.interface";
import { ImageProcessing } from "../../interfaces/image-processing.interface";

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

    // Store the processed image rather than the original upload.
    await this.fileStorage.upload(objectName, processedImage, "image/webp");

    const oldAvatar = user.avatar;

    /**
     * Update the existing domain entity instead of constructing
     * a completely new User object just to change the avatar.
     */
    user.update({
      avatar: objectName,
    });

    try {
      /**
       * Save the database change only after the new file
       * has been successfully uploaded.
       */
      const saved = await this.userRepository.save(user);

      /**
       * Delete the old file only after the database update succeeds.
       *
       * This avoids deleting the previous avatar if saving the user fails.
       */
      if (oldAvatar && oldAvatar !== objectName) {
        await this.fileStorage.delete(oldAvatar);
      }

      return saved;
    } catch (error) {
      /**
       * The database update failed after the new object was uploaded.
       *
       * Remove the newly uploaded object so we don't leave an
       * orphaned file in storage.
       *
       * Cleanup errors must not hide the original database error.
       */
      try {
        await this.fileStorage.delete(objectName);
      } catch {
        // Preserve the original database error.
      }

      throw error;
    }
  }
}
