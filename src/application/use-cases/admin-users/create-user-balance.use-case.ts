import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import {
  UserBalanceAlreadyExistsException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";
import { UserBalance } from "../../../domain/entities/user-balance.entity";
import { UserBalanceRepository } from "../../../domain/repositories/user-balance.repository";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { AuditAction } from "../../../domain/enums/audit-action.enum";
import { AuditLogger } from "../../interfaces/audit-logger.interface";

export interface CreateUserBalanceInput {
  userId: string;
  currency: PaymentCurrency;
  amount: string;
}

@Injectable()
export class CreateUserBalanceUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBalanceRepository: UserBalanceRepository,
    private readonly auditLogger: AuditLogger,
  ) {}

  async execute(
    input: CreateUserBalanceInput,
    actorUserId: string,
  ): Promise<UserBalance> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    const existingBalance =
      await this.userBalanceRepository.findByUserIdAndCurrency(
        input.userId,
        input.currency,
      );

    if (existingBalance) {
      throw new UserBalanceAlreadyExistsException(input.currency);
    }

    const now = new Date();

    const balance = new UserBalance(
      randomUUID(),
      input.userId,
      input.currency,
      input.amount,
      now,
      now,
    );

    const saved = await this.userBalanceRepository.create(balance);

    await this.auditLogger.log({
      actorUserId,
      targetUserId: input.userId,
      action: AuditAction.USER_BALANCE_CREATED,
      metadata: {
        currency: input.currency,
        amount: saved.amount,
      },
    });

    return saved;
  }
}
