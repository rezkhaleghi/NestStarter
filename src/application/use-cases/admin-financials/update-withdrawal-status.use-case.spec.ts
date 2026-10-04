import { AdminUpdateWithdrawalStatusUseCase } from "./update-withdrawal-status.use-case";

import { User } from "@domain/entities/user.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";

import {
  UserBalanceNotFoundException,
  WithdrawalNotFoundException,
} from "@domain/exceptions/domain.exception";
import { SendNotificationUseCase } from "../notifications/send-notification.use-case";

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

  const sendNotificationUseCase = {
    execute: jest.fn(),
  } as unknown as SendNotificationUseCase;

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
    sendNotificationUseCase.execute.mockResolvedValue(undefined);

    useCase = new AdminUpdateWithdrawalStatusUseCase(
      unitOfWork,
      sendNotificationUseCase,
    );
  });

  it("approves a pending withdrawal and creates in-app and email notifications", async () => {
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

    expect(sendNotificationUseCase.execute).toHaveBeenCalledTimes(2);

    expect(sendNotificationUseCase.execute).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: withdrawal.userId,
        type: NotificationType.WITHDRAWAL_APPROVED,
        channel: NotificationChannel.IN_APP,
        referenceId: withdrawal.id,
      }),
    );

    expect(sendNotificationUseCase.execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: withdrawal.userId,
        email: "user@example.com",
        type: NotificationType.WITHDRAWAL_APPROVED,
        channel: NotificationChannel.EMAIL,
        referenceId: withdrawal.id,
      }),
    );

    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();

    expect(ledgerRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a withdrawal, refunds the balance, and creates both notifications", async () => {
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

    expect(sendNotificationUseCase.execute).toHaveBeenCalledTimes(2);

    expect(sendNotificationUseCase.execute).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: NotificationType.WITHDRAWAL_REJECTED,
        channel: NotificationChannel.IN_APP,
        referenceId: withdrawal.id,
      }),
    );

    expect(sendNotificationUseCase.execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        email: "user@example.com",
        type: NotificationType.WITHDRAWAL_REJECTED,
        channel: NotificationChannel.EMAIL,
        referenceId: withdrawal.id,
        message: expect.stringContaining("Invalid destination"),
      }),
    );
  });

  it("does not fail the financial operation when notification infrastructure fails", async () => {
    const withdrawal = createWithdrawal();

    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    sendNotificationUseCase.execute.mockRejectedValue(
      new Error("notification infrastructure failure"),
    );

    const result = await useCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-1",
      status: WithdrawalStatus.APPROVED,
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.APPROVED);
    expect(withdrawalRepository.save).toHaveBeenCalledWith(withdrawal);
    expect(sendNotificationUseCase.execute).toHaveBeenCalled();
  });

  it("does not send notifications when completing a withdrawal", async () => {
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

    expect(sendNotificationUseCase.execute).not.toHaveBeenCalled();

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.WITHDRAWAL_COMPLETED,
      }),
    );
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

    expect(sendNotificationUseCase.execute).not.toHaveBeenCalled();
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
    expect(sendNotificationUseCase.execute).not.toHaveBeenCalled();
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

    expect(balance.amount).toBe("50");
    expect(userBalanceRepository.save).not.toHaveBeenCalled();
    expect(ledgerRepository.create).not.toHaveBeenCalled();
    expect(sendNotificationUseCase.execute).not.toHaveBeenCalled();
  });

  it("refunds the exact withdrawal amount", async () => {
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

  it("does not save the withdrawal if ledger creation fails", async () => {
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

    expect(withdrawalRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
    expect(sendNotificationUseCase.execute).not.toHaveBeenCalled();
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
    expect(sendNotificationUseCase.execute).not.toHaveBeenCalled();
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
    expect(sendNotificationUseCase.execute).not.toHaveBeenCalled();
  });
});
