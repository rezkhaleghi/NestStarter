import { Injectable, Logger } from "@nestjs/common";

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

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { NotificationService } from "@application/interfaces/notification.service.interface";

export interface AdminUpdateWithdrawalStatusInput {
  withdrawalId: string;
  adminUserId: string;
  status: WithdrawalStatus;
  reason?: string;
  transactionId?: string;
}

@Injectable()
export class AdminUpdateWithdrawalStatusUseCase {
  private readonly logger = new Logger(AdminUpdateWithdrawalStatusUseCase.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(input: AdminUpdateWithdrawalStatusInput): Promise<Withdrawal> {
    const result = await this.unitOfWork.execute(
      async ({
        userRepository,
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

        const user = await userRepository.findById(withdrawal.userId);

        if (!user) {
          // The withdrawal has a foreign-key relationship to the user,
          // so this should not normally happen. Keeping the lookup here
          // gives the notification workflow a reliable user snapshot.
          throw new Error(`User not found for withdrawal ${withdrawal.id}`);
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

            balance.credit(withdrawal.amount);

            const savedBalance = await userBalanceRepository.save(balance);

            await ledgerRepository.create(
              Ledger.create({
                userId: withdrawal.userId,
                currency: withdrawal.currency,
                amount: withdrawal.amount,
                balanceBefore,
                balanceAfter: savedBalance.amount,
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

        return {
          withdrawal: saved,
          userEmail: user.email,
          userName: user.firstName ?? user.userName ?? undefined,
        };
      },
    );

    // Email delivery is deliberately outside the DB transaction.
    // A SMTP failure must never roll back a committed financial operation.
    await this.sendStatusNotification(result.withdrawal, result.userEmail, {
      userName: result.userName,
      reason: input.reason,
    });

    return result.withdrawal;
  }

  private async sendStatusNotification(
    withdrawal: Withdrawal,
    email: string,
    options: {
      userName?: string;
      reason?: string;
    },
  ): Promise<void> {
    try {
      switch (withdrawal.getStatus()) {
        case WithdrawalStatus.APPROVED:
          await this.notificationService.sendWithdrawalApproved(email, {
            userName: options.userName,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            withdrawalId: withdrawal.id,
            referenceId: withdrawal.referenceId,
            status: withdrawal.getStatus(),
            destination: withdrawal.destination,
            timestamp: withdrawal.updatedAt,
          });
          break;

        case WithdrawalStatus.REJECTED:
          await this.notificationService.sendWithdrawalRejected(email, {
            userName: options.userName,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            withdrawalId: withdrawal.id,
            referenceId: withdrawal.referenceId,
            status: withdrawal.getStatus(),
            rejectionReason: withdrawal.rejectionReason ?? undefined,
            timestamp: withdrawal.updatedAt,
          });
          break;

        // We are intentionally not sending a notification for COMPLETED yet.
        // The existing completed-email method can be wired separately when
        // the completion workflow is finalized.
        case WithdrawalStatus.COMPLETED:
          break;
      }
    } catch (error) {
      // The withdrawal transaction has already committed. Notification
      // failure must therefore be logged rather than surfaced as a failed
      // financial operation.
      this.logger.error(
        `Failed to send withdrawal ${withdrawal.getStatus().toLowerCase()} notification for ${withdrawal.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
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
