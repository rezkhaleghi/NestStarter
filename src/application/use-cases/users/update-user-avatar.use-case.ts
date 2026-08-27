import { Injectable } from "@nestjs/common";
import { User } from "../../../domain/entities/user.entity";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { FileStorage } from "../../interfaces/file-storage.interface";

@Injectable()
export class UpdateUserAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorage: FileStorage,
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

    const extension = file.mimetype.split("/")[1] || "bin";
    const objectName = `avatars/${userId}/avatar.${extension}`;

    await this.fileStorage.upload(objectName, file.buffer, file.mimetype);

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

    if (oldAvatar && oldAvatar !== objectName) {
      await this.fileStorage.delete(oldAvatar);
    }

    return saved;
  }
}
