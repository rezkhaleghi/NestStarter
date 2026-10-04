import { Injectable, Logger } from "@nestjs/common";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { Ledger } from "@domain/entities/ledger.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";

import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";

import {
  UserBalanceNotFoundException,
  WithdrawalNotFoundException,
} from "@domain/exceptions/domain.exception";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { SendNotificationUseCase } from "@application/use-cases/notifications/send-notification.use-case";

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
    private readonly sendNotificationUseCase: SendNotificationUseCase,
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
          // The withdrawal has a mandatory user FK, so this should normally
          // be impossible. Keep the check because notification delivery
          // requires a valid user snapshot.
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

            // Rejecting a withdrawal returns the reserved amount to the user.
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

    /*
     * The financial transaction is already committed here.
     *
     * Notification failure must never turn a successful withdrawal
     * operation into a failed financial operation.
     *
     * Each channel gets its own Notification record, so the database
     * records exactly which channel succeeded or failed.
     */
    await this.sendWithdrawalNotification(
      result.withdrawal,
      result.userEmail,
      result.userName,
    );

    return result.withdrawal;
  }

  private async sendWithdrawalNotification(
    withdrawal: Withdrawal,
    email: string,
    userName?: string,
  ): Promise<void> {
    const status = withdrawal.getStatus();

    let type: NotificationType;
    let title: string;
    let message: string;

    switch (status) {
      case WithdrawalStatus.APPROVED:
        type = NotificationType.WITHDRAWAL_APPROVED;
        title = "Withdrawal approved";
        message = `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been approved.`;
        break;

      case WithdrawalStatus.REJECTED: {
        type = NotificationType.WITHDRAWAL_REJECTED;

        const reason = withdrawal.rejectionReason ?? "No reason was provided.";

        title = "Withdrawal rejected";
        message = `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} was rejected. Reason: ${reason}`;
        break;
      }

      /*
       * Completion currently has no notification event because the existing
       * email/template workflow does not define one yet.
       */
      case WithdrawalStatus.COMPLETED:
        return;

      default:
        return;
    }

    const baseInput = {
      userId: withdrawal.userId,
      type,
      title,
      message,
      referenceId: withdrawal.id,
    };

    try {
      /*
       * In-app notification is persisted independently from email.
       */
      await this.sendNotificationUseCase.execute({
        ...baseInput,
        channel: NotificationChannel.IN_APP,
      });

      /*
       * Email is a separate Notification record.
       */
      await this.sendNotificationUseCase.execute({
        ...baseInput,
        email,
        channel: NotificationChannel.EMAIL,
      });
    } catch (error) {
      /*
       * SendNotificationUseCase normally records provider failures as
       * FAILED notifications. This catch protects the financial workflow
       * from unexpected notification infrastructure errors.
       */
      this.logger.error(
        `Unexpected notification error for withdrawal ${withdrawal.id}`,
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
