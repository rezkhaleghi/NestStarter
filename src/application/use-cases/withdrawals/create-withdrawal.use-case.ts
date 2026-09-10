import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import {
  InsufficientBalanceException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";
import { subtractDecimal } from "@domain/utils/decimal.util";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { Ledger } from "@domain/entities/ledger.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";

export interface CreateWithdrawalInput {
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  destination: string;
}

@Injectable()
export class CreateWithdrawalUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreateWithdrawalInput): Promise<Withdrawal> {
    return this.unitOfWork.execute(
      async ({
        userRepository,
        userBalanceRepository,
        ledgerRepository,
        auditLogRepository,
        withdrawalRepository,
      }) => {
        const user = await userRepository.findById(input.userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        const amountValue = Number(input.amount);

        if (!Number.isFinite(amountValue) || amountValue <= 0) {
          throw new Error("Withdrawal amount must be positive.");
        }

        const balance =
          await userBalanceRepository.findByUserIdAndCurrencyForUpdate(
            input.userId,
            input.currency,
          );

        if (!balance) {
          throw new Error(`No balance exists for ${input.currency}.`);
        }

        // Preserve the original balance before mutating the entity.
        const balanceBefore = balance.amount;

        const balanceAfter = subtractDecimal(balanceBefore, input.amount);

        if (Number(balanceAfter) < 0) {
          throw new InsufficientBalanceException();
        }

        balance.amount = balanceAfter;

        const savedBalance = await userBalanceRepository.save(balance);

        const withdrawal = Withdrawal.create({
          id: randomUUID(),
          userId: input.userId,
          currency: input.currency,
          amount: input.amount,
          status: WithdrawalStatus.PENDING,
          destination: input.destination,
          referenceId: randomUUID(),
        });

        const savedWithdrawal = await withdrawalRepository.create(withdrawal);

        await ledgerRepository.create(
          Ledger.create({
            userId: input.userId,
            currency: input.currency,
            amount: `-${input.amount}`,
            balanceBefore,
            balanceAfter: savedBalance.amount,
            type: LedgerType.WITHDRAWAL,
            referenceId: savedWithdrawal.referenceId,
            metadata: {
              withdrawalId: savedWithdrawal.id,
              destination: input.destination,
            },
          }),
        );

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.userId,
            targetUserId: input.userId,
            action: AuditAction.USER_BALANCE_UPDATED,
            metadata: {
              type: "WITHDRAWAL_REQUESTED",
              withdrawalId: savedWithdrawal.id,
              referenceId: savedWithdrawal.referenceId,
              amount: input.amount,
              currency: input.currency,
            },
          }),
        );

        return savedWithdrawal;
      },
    );
  }
}
