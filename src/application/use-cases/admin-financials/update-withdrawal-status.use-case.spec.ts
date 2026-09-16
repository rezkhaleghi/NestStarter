import { AdminUpdateWithdrawalStatusUseCase } from "./update-withdrawal-status.use-case";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";

import {
  UserBalanceNotFoundException,
  WithdrawalNotFoundException,
} from "@domain/exceptions/domain.exception";

describe("AdminUpdateWithdrawalStatusUseCase", () => {
  const withdrawalRepository = {
    findByIdForUpdate: jest.fn(),
    save: jest.fn(),
  };

  const userBalanceRepository = {
    findByUserIdAndCurrencyForUpdate: jest.fn(),
    save: jest.fn(),
  };

  const ledgerRepository = {
    create: jest.fn(),
  };

  const auditLogRepository = {
    create: jest.fn(),
  };

  const unitOfWork = {
    execute: jest.fn(),
  };

  let useCase: AdminUpdateWithdrawalStatusUseCase;

  const createWithdrawal = () =>
    Withdrawal.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      destination: "destination-1",
    });

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWork.execute.mockImplementation(
      async (
        callback: (repositories: {
          withdrawalRepository: typeof withdrawalRepository;
          userBalanceRepository: typeof userBalanceRepository;
          ledgerRepository: typeof ledgerRepository;
          auditLogRepository: typeof auditLogRepository;
        }) => Promise<unknown>,
      ) =>
        callback({
          withdrawalRepository,
          userBalanceRepository,
          ledgerRepository,
          auditLogRepository,
        }),
    );

    withdrawalRepository.save.mockImplementation(
      async (withdrawal: Withdrawal) => withdrawal,
    );

    userBalanceRepository.save.mockImplementation(
      async (balance: { amount: string }) => balance,
    );

    ledgerRepository.create.mockResolvedValue(undefined);
    auditLogRepository.create.mockResolvedValue(undefined);

    useCase = new AdminUpdateWithdrawalStatusUseCase(unitOfWork);
  });

  it("approves a pending withdrawal", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const result = await useCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-1",
      status: WithdrawalStatus.APPROVED,
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.APPROVED);
    expect(withdrawalRepository.save).toHaveBeenCalledWith(withdrawal);
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.WITHDRAWAL_APPROVED,
      }),
    );
    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();
    expect(ledgerRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a pending withdrawal and refunds the balance", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const balance = {
      amount: "500",
    };

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    const result = await useCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-1",
      status: WithdrawalStatus.REJECTED,
      reason: "Invalid destination",
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.REJECTED);
    expect(result.rejectionReason).toBe("Invalid destination");

    expect(balance.amount).toBe("600");
    expect(userBalanceRepository.save).toHaveBeenCalledWith(balance);

    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: withdrawal.userId,
        currency: withdrawal.currency,
        amount: "100",
        balanceBefore: "500",
        balanceAfter: "600",
        type: LedgerType.REFUND,
        referenceId: withdrawal.referenceId,
      }),
    );

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.WITHDRAWAL_REJECTED,
      }),
    );
  });

  it("completes an approved withdrawal", async () => {
    const withdrawal = createWithdrawal();
    withdrawal.approve();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const result = await useCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-1",
      status: WithdrawalStatus.COMPLETED,
      transactionId: "tx-123",
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.COMPLETED);
    expect(result.transactionId).toBe("tx-123");

    expect(withdrawalRepository.save).toHaveBeenCalledWith(withdrawal);

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.WITHDRAWAL_COMPLETED,
      }),
    );

    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();
    expect(ledgerRepository.create).not.toHaveBeenCalled();
  });

  it("throws when the withdrawal does not exist", async () => {
    withdrawalRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        withdrawalId: "missing-withdrawal",
        adminUserId: "admin-1",
        status: WithdrawalStatus.APPROVED,
      }),
    ).rejects.toThrow(WithdrawalNotFoundException);
  });

  it("throws when rejecting and the balance does not exist", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({
        withdrawalId: withdrawal.id,
        adminUserId: "admin-1",
        status: WithdrawalStatus.REJECTED,
        reason: "Invalid destination",
      }),
    ).rejects.toThrow(UserBalanceNotFoundException);

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.PENDING);
    expect(ledgerRepository.create).not.toHaveBeenCalled();
  });

  it("does not allow completing a pending withdrawal", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    await expect(
      useCase.execute({
        withdrawalId: withdrawal.id,
        adminUserId: "admin-1",
        status: WithdrawalStatus.COMPLETED,
        transactionId: "tx-123",
      }),
    ).rejects.toThrow();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.PENDING);
    expect(withdrawalRepository.save).not.toHaveBeenCalled();
  });

  it("does not allow rejecting an approved withdrawal", async () => {
    const withdrawal = createWithdrawal();
    withdrawal.approve();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    await expect(
      useCase.execute({
        withdrawalId: withdrawal.id,
        adminUserId: "admin-1",
        status: WithdrawalStatus.REJECTED,
        reason: "Too late",
      }),
    ).rejects.toThrow();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.APPROVED);
    expect(ledgerRepository.create).not.toHaveBeenCalled();
  });

  it("does not allow approving an already completed withdrawal", async () => {
    const withdrawal = createWithdrawal();
    withdrawal.approve();
    withdrawal.complete("tx-123");

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    await expect(
      useCase.execute({
        withdrawalId: withdrawal.id,
        adminUserId: "admin-1",
        status: WithdrawalStatus.APPROVED,
      }),
    ).rejects.toThrow();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.COMPLETED);
  });
});
