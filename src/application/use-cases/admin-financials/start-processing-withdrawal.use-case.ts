import { Injectable } from "@nestjs/common";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { WithdrawalNotFoundException } from "@domain/exceptions/domain.exception";

export interface StartProcessingWithdrawalInput {
  withdrawalId: string;
  adminUserId: string;
  providerWithdrawalId?: string;
}

@Injectable()
export class StartProcessingWithdrawalUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: StartProcessingWithdrawalInput): Promise<Withdrawal> {
    return this.unitOfWork.execute(
      async ({ withdrawalRepository, auditLogRepository }) => {
        const withdrawal = await withdrawalRepository.findByIdForUpdate(
          input.withdrawalId,
        );

        if (!withdrawal) {
          throw new WithdrawalNotFoundException();
        }

        withdrawal.startProcessing(input.providerWithdrawalId);

        const saved = await withdrawalRepository.save(withdrawal);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.adminUserId,
            targetUserId: withdrawal.userId,
            action: AuditAction.USER_UPDATED,
            metadata: {
              type: "WITHDRAWAL_PROCESSING",
              withdrawalId: saved.id,
              referenceId: saved.referenceId,
              amount: saved.amount,
              currency: saved.currency,
              providerWithdrawalId: saved.providerWithdrawalId,
            },
          }),
        );

        return saved;
      },
    );
  }
}
