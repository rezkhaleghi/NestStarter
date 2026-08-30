import { Injectable } from "@nestjs/common";
import { User } from "../../../domain/entities/user.entity";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";

@Injectable()
export class UpdateCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    userId: string,
    input: {
      firstName?: string | null;
      lastName?: string | null;
      userName?: string | null;
      dateOfBirth?: Date | null;
      bio?: string | null;
    },
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    /**
     * The use case decides which fields the current user is allowed
     * to modify.
     *
     * The domain entity then applies those changes to itself.
     *
     * This prevents the API DTO from being coupled directly to
     * the domain layer.
     */
    user.update({
      firstName: input.firstName,
      lastName: input.lastName,
      userName: input.userName,
      dateOfBirth: input.dateOfBirth,
      bio: input.bio,
    });

    return this.userRepository.save(user);
  }
}
