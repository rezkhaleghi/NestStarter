import { Injectable } from "@nestjs/common";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { Ledger } from "@domain/entities/ledger.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";

import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  UserBalanceNotFoundException,
  WithdrawalNotFoundException,
} from "@domain/exceptions/domain.exception";

import { addDecimal } from "@domain/utils/decimal.util";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface AdminUpdateWithdrawalStatusInput {
  withdrawalId: string;
  adminUserId: string;
  status: WithdrawalStatus;
  reason?: string;
  transactionId?: string;
}

@Injectable()
export class AdminUpdateWithdrawalStatusUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: AdminUpdateWithdrawalStatusInput): Promise<Withdrawal> {
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
          throw new WithdrawalNotFoundException();
        }

        switch (input.status) {
          case WithdrawalStatus.APPROVED:
            withdrawal.approve();
            break;

          case WithdrawalStatus.REJECTED: {
            const balance =
              await userBalanceRepository.findByUserIdAndCurrencyForUpdate(
                withdrawal.userId,
                withdrawal.currency,
              );

            if (!balance) {
              throw new UserBalanceNotFoundException(withdrawal.currency);
            }

            withdrawal.reject(input.reason);

            const balanceBefore = balance.amount;
            const balanceAfter = addDecimal(balanceBefore, withdrawal.amount);

            balance.amount = balanceAfter;

            await userBalanceRepository.save(balance);

            await ledgerRepository.create(
              Ledger.create({
                userId: withdrawal.userId,
                currency: withdrawal.currency,
                amount: withdrawal.amount,
                balanceBefore,
                balanceAfter,
                type: LedgerType.REFUND,
                referenceId: withdrawal.referenceId,
                metadata: {
                  withdrawalId: withdrawal.id,
                  rejectedBy: input.adminUserId,
                  reason: input.reason ?? null,
                },
              }),
            );

            break;
          }

          case WithdrawalStatus.COMPLETED:
            withdrawal.complete(input.transactionId);
            break;

          default:
            throw new Error(`Unsupported withdrawal status: ${input.status}`);
        }

        const saved = await withdrawalRepository.save(withdrawal);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.adminUserId,
            targetUserId: withdrawal.userId,
            action: this.getAuditAction(input.status),
            metadata: {
              withdrawalId: saved.id,
              referenceId: saved.referenceId,
              amount: saved.amount,
              currency: saved.currency,
              reason: input.reason ?? null,
              transactionId: saved.transactionId,
            },
          }),
        );

        return saved;
      },
    );
  }

  private getAuditAction(status: WithdrawalStatus): AuditAction {
    switch (status) {
      case WithdrawalStatus.APPROVED:
        return AuditAction.WITHDRAWAL_APPROVED;

      case WithdrawalStatus.REJECTED:
        return AuditAction.WITHDRAWAL_REJECTED;

      case WithdrawalStatus.COMPLETED:
        return AuditAction.WITHDRAWAL_COMPLETED;

      default:
        throw new Error(`Unsupported withdrawal status: ${status}`);
    }
  }
}
