import { describe, expect, it, jest } from "@jest/globals";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { User } from "@domain/entities/user.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { AdminApproveWithdrawalUseCase } from "./approve-withdrawal.use-case";

describe("AdminApproveWithdrawalUseCase", () => {
  it("approves a pending withdrawal and audits the admin action", async () => {
    const user = User.create({
      id: "user-id",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    const withdrawal = Withdrawal.create({
      id: "withdrawal-id",
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
      status: WithdrawalStatus.PENDING,
    });

    const withdrawalRepository = {
      findByIdForUpdate: jest.fn<() => Promise<Withdrawal | null>>(),
      save: jest.fn<(value: Withdrawal) => Promise<Withdrawal>>(),
    };

    const auditLogRepository = {
      create: jest.fn<(value: unknown) => Promise<unknown>>(),
    };

    const unitOfWork = {
      execute: jest.fn(),
    };

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);
    withdrawalRepository.save.mockImplementation(
      async (value: Withdrawal) => value,
    );
    auditLogRepository.create.mockImplementation(
      async (value: unknown) => value,
    );

    unitOfWork.execute.mockImplementation(
      async (work: (repositories: unknown) => Promise<unknown>) =>
        work({
          withdrawalRepository,
          auditLogRepository,
        }),
    );

    const result = await new AdminApproveWithdrawalUseCase(
      unitOfWork as any,
    ).execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-id",
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.APPROVED);

    expect(withdrawalRepository.findByIdForUpdate).toHaveBeenCalledWith(
      withdrawal.id,
    );

    expect(withdrawalRepository.save).toHaveBeenCalledWith(withdrawal);

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        action: AuditAction.WITHDRAWAL_APPROVED,
      }),
    );
  });
});
