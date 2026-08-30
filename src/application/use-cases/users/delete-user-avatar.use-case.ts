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

    /**
     * Remove the physical avatar file from storage first.
     */
    if (user.avatar) {
      await this.fileStorage.delete(user.avatar);
    }

    /**
     * Clear the avatar reference on the existing domain entity.
     *
     * `null` means "explicitly clear this field".
     */
    user.update({
      avatar: null,
    });

    return this.userRepository.save(user);
  }
}
