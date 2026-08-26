import { Injectable } from "@nestjs/common";
import { UserRole } from "../../../domain/enums/user-role.enum";
import {
  CannotDeleteSelfException,
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
      throw new CannotDeleteSelfException();
    }
    const deleted = await this.userRepository.deleteAdminUser(id);
    if (!deleted) {
      throw new CannotRemoveLastAdminException();
    }
  }
}
