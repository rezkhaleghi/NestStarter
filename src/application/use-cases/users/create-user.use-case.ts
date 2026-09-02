import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { User } from "../../../domain/entities/user.entity";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { CreateUserInput } from "../../dtos/create-user.input";
import { UserAlreadyExistsException } from "../../../domain/exceptions/domain.exception";
import { normalizeEmail } from "../../utils/normalize-email";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly passwordHasher: PasswordHasher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);

    const hashedPassword = await this.passwordHasher.hash(input.password);

    return this.unitOfWork.execute(
      async ({ userRepository, userBalanceRepository }) => {
        const existing = await userRepository.findByEmail(email);

        if (existing) {
          throw new UserAlreadyExistsException(email);
        }

        const user = User.create({
          id: randomUUID(),
          email,
          hashedPassword,
        });

        user.verifyEmail();

        const balance = UserBalance.create({
          userId: user.id,
          currency:
            (process.env.DEFAULT_CURRENCY as PaymentCurrency) ||
            PaymentCurrency.USD,
          amount: "0",
        });

        await userRepository.save(user);
        await userBalanceRepository.create(balance);

        return user;
      },
    );
  }
}
