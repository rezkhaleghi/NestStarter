import { Injectable } from "@nestjs/common";

import {
  UserBalanceNotFoundException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { AuditAction } from "../../../domain/enums/audit-action.enum";
import { AuditLogger } from "../../interfaces/audit-logger.interface";
import { UnitOfWork } from "../../interfaces/unit-of-work.interface";

export interface UpdateUserBalanceInput {
  userId: string;
  currency: PaymentCurrency;
  amount: string;
}

@Injectable()
export class UpdateUserBalanceUseCase {
  constructor(
    private readonly auditLogger: AuditLogger,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: UpdateUserBalanceInput, actorUserId: string) {
    return this.unitOfWork.execute(
      async ({ userRepository, userBalanceRepository }) => {
        const user = await userRepository.findById(input.userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        const balance = await userBalanceRepository.findByUserIdAndCurrency(
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

        const saved = await userBalanceRepository.save(balance);

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
      },
    );
  }
}
