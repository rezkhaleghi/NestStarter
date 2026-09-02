import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user.entity";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { CreateUserInput } from "../../dtos/create-user.input";
import { UserAlreadyExistsException } from "../../../domain/exceptions/domain.exception";
import { normalizeEmail } from "../../utils/normalize-email";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { UserBalanceRepository } from "@domain/repositories/user-balance.repository";

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly userBalanceRepository: UserBalanceRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsException(email);
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);
    const user = User.create({ id: randomUUID(), email, hashedPassword });
    user.verifyEmail();

    // create user balance for the new user
    const balance = new UserBalance(
      crypto.randomUUID(),
      user.id,
      PaymentCurrency.USD,
      "0",
      new Date(),
      new Date(),
    );

    await this.userBalanceRepository.create(balance);

    return this.userRepository.save(user);
  }
}
