import { Injectable } from "@nestjs/common";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { Ledger } from "@domain/entities/ledger.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { addDecimal } from "@domain/utils/decimal.util";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface RejectWithdrawalInput {
  withdrawalId: string;
  adminUserId: string;
  reason?: string;
}

@Injectable()
export class RejectWithdrawalUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: RejectWithdrawalInput): Promise<Withdrawal> {
    return this.unitOfWork.execute(
      async ({
        withdrawalRepository,
        userBalanceRepository,
        ledgerRepository,
        auditLogRepository,
      }) => {
        const withdrawal = await withdrawalRepository.findByIdForUpdate(
          input.withdrawalId,
        );
        if (!withdrawal) {
          throw new Error("Withdrawal not found.");
        }
        if (withdrawal.status !== WithdrawalStatus.PENDING) {
          throw new Error("Only PENDING withdrawals can be rejected.");
        }

        const balance =
          await userBalanceRepository.findByUserIdAndCurrencyForUpdate(
            withdrawal.userId,
            withdrawal.currency,
          );
        if (!balance) {
          throw new Error(`Balance for ${withdrawal.currency} not found.`);
        }

        const before = balance.amount;
        const after = addDecimal(before, withdrawal.amount);
        balance.amount = after;
        await userBalanceRepository.save(balance);

        await ledgerRepository.create(
          Ledger.create({
            userId: withdrawal.userId,
            currency: withdrawal.currency,
            amount: withdrawal.amount,
            balanceBefore: before,
            balanceAfter: after,
            type: LedgerType.REFUND,
            referenceId: withdrawal.referenceId,
            metadata: {
              withdrawalId: withdrawal.id,
              rejectedBy: input.adminUserId,
              reason: input.reason ?? null,
            },
          }),
        );

        withdrawal.reject(input.reason);
        const saved = await withdrawalRepository.save(withdrawal);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.adminUserId,
            targetUserId: withdrawal.userId,
            action: AuditAction.USER_UPDATED,
            metadata: {
              type: "WITHDRAWAL_REJECTED",
              withdrawalId: saved.id,
              referenceId: saved.referenceId,
              amount: saved.amount,
              currency: saved.currency,
              reason: input.reason ?? null,
            },
          }),
        );

        return saved;
      },
    );
  }
}
