import { Injectable } from "@nestjs/common";

import { Ledger } from "@domain/entities/ledger.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { AuditAction } from "../../../domain/enums/audit-action.enum";
import { LedgerType } from "../../../domain/enums/ledger-type.enum";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import {
  addDecimal,
  isNegativeDecimal,
} from "../../../domain/utils/decimal.util";
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

        // input.amount is a signed adjustment:
        // +100  → increase balance by 100
        // -100  → decrease balance by 100
        const amount = input.amount;
        const after = addDecimal(before, amount);

        // User balances cannot become negative.
        if (isNegativeDecimal(after)) {
          throw new Error("Insufficient balance");
        }

        // No balance change means there is nothing to record.
        if (amount === "0") {
          return existingBalance;
        }

        let saved;

        if (existingBalance) {
          existingBalance.amount = after;

          saved = await userBalanceRepository.save(existingBalance);
        } else {
          const balance = UserBalance.create({
            userId: input.userId,
            currency: input.currency,
            amount: after,
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
