import { Injectable } from "@nestjs/common";

import { Ledger } from "@domain/entities/ledger.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { AuditAction } from "../../../domain/enums/audit-action.enum";
import { LedgerType } from "../../../domain/enums/ledger-type.enum";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { subtractDecimal } from "../../../domain/utils/decimal.util";
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
      async ({ userRepository, userBalanceRepository, ledgerRepository }) => {
        const user = await userRepository.findById(input.userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        const existingBalance =
          await userBalanceRepository.findByUserIdAndCurrency(
            input.userId,
            input.currency,
          );

        const before = existingBalance?.amount ?? "0";

        if (before === input.amount) {
          return existingBalance;
        }

        const amount = subtractDecimal(input.amount, before);

        let saved;

        if (existingBalance) {
          existingBalance.amount = input.amount;

          saved = await userBalanceRepository.save(existingBalance);
        } else {
          const balance = UserBalance.create({
            userId: input.userId,
            currency: input.currency,
            amount: input.amount,
          });

          saved = await userBalanceRepository.create(balance);
        }

        await ledgerRepository.create(
          Ledger.create({
            userId: input.userId,
            currency: input.currency,
            amount,
            balanceBefore: before,
            balanceAfter: saved.amount,
            type: LedgerType.ADMIN_ADJUSTMENT,
            actorUserId,
          }),
        );

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
