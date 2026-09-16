import { Injectable } from "@nestjs/common";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { WithdrawalNotFoundException } from "@domain/exceptions/domain.exception";

export interface ApproveWithdrawalInput {
  withdrawalId: string;
  adminUserId: string;
}

@Injectable()
export class AdminApproveWithdrawalUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: ApproveWithdrawalInput): Promise<Withdrawal> {
    return this.unitOfWork.execute(
      async ({ withdrawalRepository, auditLogRepository }) => {
        const withdrawal = await withdrawalRepository.findByIdForUpdate(
          input.withdrawalId,
        );
        if (!withdrawal) {
          throw new WithdrawalNotFoundException();
        }

        withdrawal.approve();
        const saved = await withdrawalRepository.save(withdrawal);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.adminUserId,
            targetUserId: withdrawal.userId,
            action: AuditAction.WITHDRAWAL_APPROVED,
            metadata: {
              withdrawalId: saved.id,
              referenceId: saved.referenceId,
              amount: saved.amount,
              currency: saved.currency,
            },
          }),
        );

        return saved;
      },
    );
  }
}
