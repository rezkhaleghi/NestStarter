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
    const existing = await this.userRepository.findById(userId);

    if (!existing) {
      throw new UserNotFoundException();
    }

    // Process the uploaded image:
    // - fixes EXIF orientation
    // - resizes to 512x512
    // - converts it to WebP
    // - compresses it with quality 85
    const processedImage = await this.imageProcessing.processAvatar(
      file.buffer,
    );

    // All avatars are stored as WebP after processing.
    const objectName = `avatars/${userId}/avatar.webp`;

    // Upload the processed image, not the original file.
    await this.fileStorage.upload(objectName, processedImage, "image/webp");

    const oldAvatar = existing.avatar;

    const updated = new User(
      existing.id,
      existing.email,
      existing.hashedPassword,
      existing.role,
      existing.emailVerified,
      existing.createdAt,
      existing.updatedAt,
      existing.googleId,
      existing.firstName,
      existing.lastName,
      existing.userName,
      existing.dateOfBirth,
      objectName,
      existing.bio,
    );

    const saved = await this.userRepository.save(updated);

    // Delete the previous avatar after the database update succeeds.
    if (oldAvatar && oldAvatar !== objectName) {
      await this.fileStorage.delete(oldAvatar);
    }

    return saved;
  }
}
