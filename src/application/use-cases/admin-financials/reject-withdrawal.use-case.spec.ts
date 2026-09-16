import { describe, expect, it, jest } from "@jest/globals";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { User } from "@domain/entities/user.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { AdminRejectWithdrawalUseCase } from "./reject-withdrawal.use-case";

describe("AdminRejectWithdrawalUseCase", () => {
  it("rejects a pending withdrawal and refunds its balance", async () => {
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

    const balance = UserBalance.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "50",
    });

    const withdrawalRepository = {
      findByIdForUpdate: jest.fn<() => Promise<Withdrawal | null>>(),
      save: jest.fn<(value: Withdrawal) => Promise<Withdrawal>>(),
    };

    const userBalanceRepository = {
      findByUserIdAndCurrencyForUpdate:
        jest.fn<() => Promise<UserBalance | null>>(),
      save: jest.fn<(value: UserBalance) => Promise<UserBalance>>(),
    };

    const ledgerRepository = {
      create: jest.fn<(value: unknown) => Promise<unknown>>(),
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

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );
    userBalanceRepository.save.mockImplementation(
      async (value: UserBalance) => value,
    );

    ledgerRepository.create.mockImplementation(async (value: unknown) => value);

    auditLogRepository.create.mockImplementation(
      async (value: unknown) => value,
    );

    unitOfWork.execute.mockImplementation(
      async (work: (repositories: unknown) => Promise<unknown>) =>
        work({
          withdrawalRepository,
          userBalanceRepository,
          ledgerRepository,
          auditLogRepository,
        }),
    );

    const result = await new AdminRejectWithdrawalUseCase(
      unitOfWork as any,
    ).execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-id",
      reason: "Manual review failed",
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.REJECTED);
    expect(balance.amount).toBe("100");

    expect(withdrawalRepository.findByIdForUpdate).toHaveBeenCalledWith(
      withdrawal.id,
    );

    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).toHaveBeenCalledWith(user.id, PaymentCurrency.USD);

    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: LedgerType.REFUND,
      }),
    );

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        action: AuditAction.WITHDRAWAL_REJECTED,
      }),
    );
  });
});
