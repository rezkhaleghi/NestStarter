import { Injectable } from "@nestjs/common";

import {
  UserBalanceNotFoundException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { UserBalanceRepository } from "../../../domain/repositories/user-balance.repository";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { AuditAction } from "../../../domain/enums/audit-action.enum";
import { AuditLogger } from "../../interfaces/audit-logger.interface";

export interface UpdateUserBalanceInput {
  userId: string;
  currency: PaymentCurrency;
  amount: string;
}

@Injectable()
export class UpdateUserBalanceUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBalanceRepository: UserBalanceRepository,
    private readonly auditLogger: AuditLogger,
  ) {}

  async execute(input: UpdateUserBalanceInput, actorUserId: string) {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    const balance = await this.userBalanceRepository.findByUserIdAndCurrency(
      input.userId,
      input.currency,
    );

    if (!balance) {
      throw new UserBalanceNotFoundException(input.currency);
    }

    const before = balance.amount;

    if (before === input.amount) {
      return balance;
    }

    balance.amount = input.amount;
    balance.updatedAt = new Date();

    const saved = await this.userBalanceRepository.save(balance);

    await this.auditLogger.log({
      actorUserId,
      targetUserId: input.userId,
      action: AuditAction.USER_BALANCE_UPDATED,
      metadata: {
        currency: input.currency,
        from: before,
        to: saved.amount,
      },
    });

    return saved;
  }
}
