import { Injectable } from "@nestjs/common";
import { User } from "../../domain/entities/user.entity";
import { UserNotFoundException } from "../../domain/exceptions/domain.exception";
import { UserRepository } from "../../domain/repositories/user.repository";

@Injectable()
export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }
}
