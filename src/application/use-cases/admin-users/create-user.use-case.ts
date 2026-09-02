import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserAlreadyExistsException } from "../../../domain/exceptions/domain.exception";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { AuditLogger } from "../../interfaces/audit-logger.interface";
import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { normalizeEmail } from "../../utils/normalize-email";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { UserBalanceRepository } from "@domain/repositories/user-balance.repository";

export interface CreateAdminUserInput {
  email: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditLogger: AuditLogger,
    private readonly userBalanceRepository: UserBalanceRepository,
  ) {}

  async execute(
    input: CreateAdminUserInput,
    actorUserId: string,
  ): Promise<User> {
    const email = normalizeEmail(input.email);

    if (await this.userRepository.findByEmail(email)) {
      throw new UserAlreadyExistsException(email);
    }

    const user = new User(
      randomUUID(),
      email,
      await this.passwordHasher.hash(input.password),
      input.role,

      // Admin-created accounts are considered email-verified.
      true,
    );

    const saved = await this.userRepository.save(user);

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

    await this.auditLogger.log({
      actorUserId,
      targetUserId: saved.id,
      action: AuditAction.USER_CREATED,
      metadata: {
        email: saved.email,
        role: saved.role,
      },
    });

    return saved;
  }
}
