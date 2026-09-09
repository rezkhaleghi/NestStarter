import { Injectable } from "@nestjs/common";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface ApproveWithdrawalInput {
  withdrawalId: string;
  adminUserId: string;
}

@Injectable()
export class ApproveWithdrawalUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: ApproveWithdrawalInput): Promise<Withdrawal> {
    return this.unitOfWork.execute(
      async ({ withdrawalRepository, auditLogRepository }) => {
        const withdrawal = await withdrawalRepository.findByIdForUpdate(
          input.withdrawalId,
        );
        if (!withdrawal) {
          throw new Error("Withdrawal not found.");
        }
        if (withdrawal.status !== WithdrawalStatus.PENDING) {
          throw new Error("Only PENDING withdrawals can be approved.");
        }

        withdrawal.approve();
        const saved = await withdrawalRepository.save(withdrawal);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.adminUserId,
            targetUserId: withdrawal.userId,
            action: AuditAction.USER_UPDATED,
            metadata: {
              type: "WITHDRAWAL_APPROVED",
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
