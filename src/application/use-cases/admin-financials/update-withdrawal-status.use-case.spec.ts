import { AdminUpdateWithdrawalStatusUseCase } from "./update-withdrawal-status.use-case";

import { User } from "@domain/entities/user.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";

import {
  UserBalanceNotFoundException,
  WithdrawalNotFoundException,
} from "@domain/exceptions/domain.exception";

describe("AdminUpdateWithdrawalStatusUseCase", () => {
  const userRepository = {
    findById: jest.fn(),
  };

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

  const notificationService = {
    sendOtp: jest.fn(),
    sendWithdrawalApproved: jest.fn(),
    sendWithdrawalRejected: jest.fn(),
  };

  const unitOfWork = {
    execute: jest.fn(),
  };

  let useCase: AdminUpdateWithdrawalStatusUseCase;

  const createUser = () =>
    User.create({
      email: "user@example.com",
      hashedPassword: "hashed-password",
    });

  const createWithdrawal = () =>
    Withdrawal.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      destination: "destination-1",
    });

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository.findById.mockResolvedValue(createUser());

    unitOfWork.execute.mockImplementation(
      async (
        callback: (repositories: {
          userRepository: typeof userRepository;
          withdrawalRepository: typeof withdrawalRepository;
          userBalanceRepository: typeof userBalanceRepository;
          ledgerRepository: typeof ledgerRepository;
          auditLogRepository: typeof auditLogRepository;
        }) => Promise<unknown>,
      ) =>
        callback({
          userRepository,
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
      async (balance: UserBalance) => balance,
    );

    ledgerRepository.create.mockResolvedValue(undefined);
    auditLogRepository.create.mockResolvedValue(undefined);

    notificationService.sendWithdrawalApproved.mockResolvedValue(undefined);
    notificationService.sendWithdrawalRejected.mockResolvedValue(undefined);

    useCase = new AdminUpdateWithdrawalStatusUseCase(
      unitOfWork,
      notificationService,
    );
  });

  it("approves a pending withdrawal and sends an approval notification", async () => {
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

    expect(notificationService.sendWithdrawalApproved).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        amount: "100",
        currency: PaymentCurrency.USDT,
        withdrawalId: withdrawal.id,
        referenceId: withdrawal.referenceId,
        status: WithdrawalStatus.APPROVED,
        destination: "destination-1",
      }),
    );

    expect(notificationService.sendWithdrawalRejected).not.toHaveBeenCalled();

    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();

    expect(ledgerRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a pending withdrawal, refunds the balance, and sends a rejection notification", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const balance = UserBalance.create({
      userId: "user-1",
      currency: withdrawal.currency,
      amount: "50",
    });

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

    expect(balance.amount).toBe("150");

    expect(userBalanceRepository.save).toHaveBeenCalledWith(balance);

    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: withdrawal.userId,
        currency: withdrawal.currency,
        amount: "100",
        balanceBefore: "50",
        balanceAfter: "150",
        type: LedgerType.REFUND,
        referenceId: withdrawal.referenceId,
      }),
    );

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.WITHDRAWAL_REJECTED,
      }),
    );

    expect(notificationService.sendWithdrawalRejected).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        amount: "100",
        currency: PaymentCurrency.USDT,
        withdrawalId: withdrawal.id,
        referenceId: withdrawal.referenceId,
        status: WithdrawalStatus.REJECTED,
        rejectionReason: "Invalid destination",
      }),
    );

    expect(notificationService.sendWithdrawalApproved).not.toHaveBeenCalled();
  });

  it("does not fail the withdrawal operation when the approval notification fails", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    notificationService.sendWithdrawalApproved.mockRejectedValue(
      new Error("SMTP unavailable"),
    );

    const result = await useCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-1",
      status: WithdrawalStatus.APPROVED,
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.APPROVED);
    expect(withdrawalRepository.save).toHaveBeenCalledWith(withdrawal);
    expect(notificationService.sendWithdrawalApproved).toHaveBeenCalled();
  });

  it("does not fail the withdrawal operation when the rejection notification fails", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const balance = UserBalance.create({
      userId: withdrawal.userId,
      currency: withdrawal.currency,
      amount: "50",
    });

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    notificationService.sendWithdrawalRejected.mockRejectedValue(
      new Error("SMTP unavailable"),
    );

    const result = await useCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-1",
      status: WithdrawalStatus.REJECTED,
      reason: "Invalid destination",
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.REJECTED);
    expect(balance.amount).toBe("150");
    expect(userBalanceRepository.save).toHaveBeenCalledWith(balance);
    expect(ledgerRepository.create).toHaveBeenCalledTimes(1);
    expect(withdrawalRepository.save).toHaveBeenCalledWith(withdrawal);
    expect(notificationService.sendWithdrawalRejected).toHaveBeenCalled();
  });

  it("does not refund an already rejected withdrawal", async () => {
    const withdrawal = createWithdrawal();
    withdrawal.reject("Already rejected");

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const balance = UserBalance.create({
      userId: withdrawal.userId,
      currency: withdrawal.currency,
      amount: "50",
    });

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    await expect(
      useCase.execute({
        withdrawalId: withdrawal.id,
        adminUserId: "admin-1",
        status: WithdrawalStatus.REJECTED,
        reason: "Duplicate rejection",
      }),
    ).rejects.toThrow();

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.REJECTED);
    expect(balance.amount).toBe("50");

    expect(userBalanceRepository.save).not.toHaveBeenCalled();
    expect(ledgerRepository.create).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
    expect(notificationService.sendWithdrawalRejected).not.toHaveBeenCalled();
  });

  it("refunds the exact withdrawal amount and creates exactly one refund ledger", async () => {
    const withdrawal = Withdrawal.create({
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100.25",
      destination: "destination-1",
    });

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const balance = UserBalance.create({
      userId: withdrawal.userId,
      currency: withdrawal.currency,
      amount: "49.75",
    });

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    await useCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-1",
      status: WithdrawalStatus.REJECTED,
      reason: "Invalid destination",
    });

    expect(balance.amount).toBe("150");
    expect(userBalanceRepository.save).toHaveBeenCalledTimes(1);
    expect(ledgerRepository.create).toHaveBeenCalledTimes(1);

    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "100.25",
        balanceBefore: "49.75",
        balanceAfter: "150",
        type: LedgerType.REFUND,
        referenceId: withdrawal.referenceId,
      }),
    );
  });

  it("does not save the withdrawal if refund ledger creation fails", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const balance = UserBalance.create({
      userId: withdrawal.userId,
      currency: withdrawal.currency,
      amount: "50",
    });

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    ledgerRepository.create.mockRejectedValue(new Error("ledger failure"));

    await expect(
      useCase.execute({
        withdrawalId: withdrawal.id,
        adminUserId: "admin-1",
        status: WithdrawalStatus.REJECTED,
        reason: "Invalid destination",
      }),
    ).rejects.toThrow("ledger failure");

    expect(withdrawal.getStatus()).toBe(WithdrawalStatus.REJECTED);
    expect(userBalanceRepository.save).toHaveBeenCalledWith(balance);
    expect(withdrawalRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
    expect(notificationService.sendWithdrawalRejected).not.toHaveBeenCalled();
  });

  it("completes an approved withdrawal without sending an approval or rejection notification", async () => {
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

    expect(notificationService.sendWithdrawalApproved).not.toHaveBeenCalled();
    expect(notificationService.sendWithdrawalRejected).not.toHaveBeenCalled();

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

    expect(notificationService.sendWithdrawalApproved).not.toHaveBeenCalled();
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
    expect(notificationService.sendWithdrawalRejected).not.toHaveBeenCalled();
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
    expect(notificationService.sendWithdrawalRejected).not.toHaveBeenCalled();
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
    expect(notificationService.sendWithdrawalApproved).not.toHaveBeenCalled();
  });
});
