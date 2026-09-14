import { Injectable } from "@nestjs/common";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { WithdrawalNotFoundException } from "@domain/exceptions/domain.exception";

export interface CompleteWithdrawalInput {
  withdrawalId: string;
  adminUserId: string;
  transactionId?: string;
}

@Injectable()
export class AdminCompleteWithdrawalUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CompleteWithdrawalInput): Promise<Withdrawal> {
    return this.unitOfWork.execute(
      async ({ withdrawalRepository, auditLogRepository }) => {
        const withdrawal = await withdrawalRepository.findByIdForUpdate(
          input.withdrawalId,
        );

        if (!withdrawal) {
          throw new WithdrawalNotFoundException();
        }

        withdrawal.markCompleted(input.transactionId);

        const saved = await withdrawalRepository.save(withdrawal);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.adminUserId,
            targetUserId: withdrawal.userId,
            action: AuditAction.USER_UPDATED,
            metadata: {
              type: "WITHDRAWAL_COMPLETED",
              withdrawalId: saved.id,
              referenceId: saved.referenceId,
              amount: saved.amount,
              currency: saved.currency,
              transactionId: saved.transactionId,
            },
          }),
        );

        return saved;
      },
    );
  }
}
