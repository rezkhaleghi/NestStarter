import { Injectable } from "@nestjs/common";
import { UserRole } from "../../../domain/enums/user-role.enum";
import {
  CannotRemoveLastAdminException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";

@Injectable()
export class DeleteAdminUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, requesterId: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }
    if (id === requesterId) {
      throw new CannotRemoveLastAdminException();
    }
    if (
      user.role === UserRole.ADMIN &&
      (await this.userRepository.countByRole(UserRole.ADMIN)) <= 1
    ) {
      throw new CannotRemoveLastAdminException();
    }

    await this.userRepository.deleteById(id);
  }
}
