import { Injectable } from "@nestjs/common";
import { User } from "../../../domain/entities/user.entity";
import {
  UserNotFoundException,
  UsernameAlreadyExistsException,
} from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { UpdateUserProfileInput } from "../../dtos/update-user-profile.input";

@Injectable()
export class UpdateCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, input: UpdateUserProfileInput): Promise<User> {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new UserNotFoundException();
    }
    if (
      input.userName &&
      input.userName !== existing.userName &&
      (await this.userRepository.findByUserName(input.userName))
    ) {
      throw new UsernameAlreadyExistsException(input.userName);
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
      input.firstName === undefined ? existing.firstName : input.firstName,
      input.lastName === undefined ? existing.lastName : input.lastName,
      input.userName === undefined ? existing.userName : input.userName,
      input.dateOfBirth === undefined
        ? existing.dateOfBirth
        : input.dateOfBirth,
      input.avatar === undefined ? existing.avatar : input.avatar,
      input.bio === undefined ? existing.bio : input.bio,
    );
    return this.userRepository.save(updated);
  }
}
