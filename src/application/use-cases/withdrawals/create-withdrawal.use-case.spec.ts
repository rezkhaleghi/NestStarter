import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { CreateWithdrawalUseCase } from "./create-withdrawal.use-case";

import { User } from "@domain/entities/user.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { Ledger } from "@domain/entities/ledger.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  InsufficientBalanceException,
  InvalidWithdrawalAmountException,
  UserBalanceNotFoundException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("CreateWithdrawalUseCase", () => {
  let useCase: CreateWithdrawalUseCase;

  const user = User.create({
    id: "user-id",
    email: "user@example.com",
    hashedPassword: "hashed",
  });

  const userRepository = {
    findById: jest.fn<() => Promise<User | null>>(),
  };

  const userBalanceRepository = {
    findByUserIdAndCurrencyForUpdate:
      jest.fn<() => Promise<UserBalance | null>>(),
    save: jest.fn<(balance: UserBalance) => Promise<UserBalance>>(),
  };

  const withdrawalRepository = {
    create: jest.fn<(withdrawal: Withdrawal) => Promise<Withdrawal>>(),
  };

  const ledgerRepository = {
    create: jest.fn<(ledger: Ledger) => Promise<Ledger>>(),
  };

  const auditLogRepository = {
    create: jest.fn<(audit: AuditLog) => Promise<AuditLog>>(),
  };

  const unitOfWork = {
    execute:
      jest.fn<
        (
          work: (repositories: {
            userRepository: typeof userRepository;
            userBalanceRepository: typeof userBalanceRepository;
            withdrawalRepository: typeof withdrawalRepository;
            ledgerRepository: typeof ledgerRepository;
            auditLogRepository: typeof auditLogRepository;
          }) => Promise<unknown>,
        ) => Promise<unknown>
      >(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWork.execute.mockImplementation(async (work) =>
      work({
        userRepository,
        userBalanceRepository,
        withdrawalRepository,
        ledgerRepository,
        auditLogRepository,
      }),
    );

    userRepository.findById.mockResolvedValue(user);

    userBalanceRepository.save.mockImplementation(
      async (balance: UserBalance) => balance,
    );

    withdrawalRepository.create.mockImplementation(
      async (withdrawal: Withdrawal) => withdrawal,
    );

    ledgerRepository.create.mockImplementation(
      async (ledger: Ledger) => ledger,
    );

    auditLogRepository.create.mockImplementation(
      async (audit: AuditLog) => audit,
    );

    useCase = new CreateWithdrawalUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("should deduct the balance and create a pending withdrawal", async () => {
    const balance = UserBalance.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "150",
    });

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    const result = await useCase.execute({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
    });

    expect(result.getStatus()).toBe(WithdrawalStatus.PENDING);
    expect(result.destination).toBe("wallet:abc123");
    expect(balance.amount).toBe("100");

    expect(withdrawalRepository.create).toHaveBeenCalledTimes(1);

    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "-50",
        type: LedgerType.WITHDRAWAL,
      }),
    );
  });

  it("should create an audit log for the withdrawal request", async () => {
    const balance = UserBalance.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "150",
    });

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    const result = await useCase.execute({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
    });

    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);

    const audit: AuditLog = auditLogRepository.create.mock.calls[0][0];

    expect(audit.actorUserId).toBe(user.id);
    expect(audit.targetUserId).toBe(user.id);
    expect(audit.action).toBe(AuditAction.WITHDRAWAL_REQUESTED);

    expect(audit.metadata).toEqual({
      withdrawalId: result.id,
      referenceId: result.referenceId,
      amount: "50",
      currency: PaymentCurrency.USD,
    });
  });

  it("should reject the withdrawal when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "missing",
        currency: PaymentCurrency.USD,
        amount: "50",
        destination: "wallet:abc123",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();

    expect(withdrawalRepository.create).not.toHaveBeenCalled();
  });

  it("should reject zero withdrawal amounts", async () => {
    await expect(
      useCase.execute({
        userId: user.id,
        currency: PaymentCurrency.USD,
        amount: "0",
        destination: "wallet:abc123",
      }),
    ).rejects.toBeInstanceOf(InvalidWithdrawalAmountException);

    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();

    expect(withdrawalRepository.create).not.toHaveBeenCalled();
  });

  it("should reject negative withdrawal amounts", async () => {
    await expect(
      useCase.execute({
        userId: user.id,
        currency: PaymentCurrency.USD,
        amount: "-10",
        destination: "wallet:abc123",
      }),
    ).rejects.toBeInstanceOf(InvalidWithdrawalAmountException);

    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();

    expect(withdrawalRepository.create).not.toHaveBeenCalled();
  });

  it("should reject the withdrawal when the balance does not exist", async () => {
    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({
        userId: user.id,
        currency: PaymentCurrency.USD,
        amount: "50",
        destination: "wallet:abc123",
      }),
    ).rejects.toBeInstanceOf(UserBalanceNotFoundException);

    expect(withdrawalRepository.create).not.toHaveBeenCalled();
    expect(ledgerRepository.create).not.toHaveBeenCalled();
  });

  it("should reject withdrawals that exceed the balance", async () => {
    const balance = UserBalance.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "25",
    });

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    await expect(
      useCase.execute({
        userId: user.id,
        currency: PaymentCurrency.USD,
        amount: "50",
        destination: "wallet:abc123",
      }),
    ).rejects.toBeInstanceOf(InsufficientBalanceException);

    expect(balance.amount).toBe("25");
    expect(withdrawalRepository.create).not.toHaveBeenCalled();
    expect(ledgerRepository.create).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
