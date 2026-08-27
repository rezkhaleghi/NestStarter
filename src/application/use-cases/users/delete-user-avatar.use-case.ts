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
    const existing = await this.userRepository.findById(userId);

    if (!existing) {
      throw new UserNotFoundException();
    }

    if (existing.avatar) {
      await this.fileStorage.delete(existing.avatar);
    }

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
      null,
      existing.bio,
    );

    return this.userRepository.save(updated);
  }
}
