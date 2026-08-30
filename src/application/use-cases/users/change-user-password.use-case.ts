import { Injectable } from "@nestjs/common";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";

export interface ChangeUserPasswordInput {
  userId: string;
  password: string;
}

/**
 * Application use case for changing a user's password.
 *
 * Responsibilities:
 * - Load the user.
 * - Hash the new password.
 * - Apply the password change to the domain entity.
 * - Persist the updated entity.
 *
 * Password hashing is handled by PasswordHasher because it is an
 * infrastructure/application concern, while changing the password
 * on the User entity is a domain operation.
 */
@Injectable()
export class ChangeUserPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangeUserPasswordInput): Promise<void> {
    // Load the existing domain entity from the repository.
    const user = await this.userRepository.findById(input.userId);

    // A password cannot be changed for a user that does not exist.
    if (!user) {
      throw new UserNotFoundException();
    }

    // Hash the password before storing it.
    //
    // The User entity should never receive or store a plain-text password.
    const hashedPassword = await this.passwordHasher.hash(input.password);

    // Business operation with rules/invariants.
    //
    // The entity replaces its current password with the already-hashed value.
    // We mutate the existing entity instead of reconstructing a new User
    // with all of the user's unchanged properties.
    user.changePassword(hashedPassword);

    // Persist the mutated domain entity.
    //
    // The repository is responsible for mapping the domain entity
    // to the persistence model and saving it to the database.
    await this.userRepository.save(user);
  }
}
