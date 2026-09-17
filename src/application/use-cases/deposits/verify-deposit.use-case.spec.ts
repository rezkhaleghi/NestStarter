import { VerifyDepositUseCase } from "./verify-deposit.use-case";

import { Deposit } from "@domain/entities/deposit.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { Ledger } from "@domain/entities/ledger.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  DepositNotFoundException,
  NotMatchException,
  UserBalanceNotFoundException,
} from "@domain/exceptions/domain.exception";

import { PaymentProviderResolver } from "@application/interfaces/payment-provider-resolver.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("VerifyDepositUseCase", () => {
  let useCase: VerifyDepositUseCase;

  const currency = Object.values(PaymentCurrency)[0] as PaymentCurrency;

  const paymentProviderMock = {
    verifyPayment: jest.fn(),
  };

  const paymentProviderResolverMock = {
    resolve: jest.fn().mockReturnValue(paymentProviderMock),
  };

  const depositRepositoryMock = {
    findByUserIdAndIdForUpdate: jest.fn(),
    save: jest.fn(),
  };

  const userBalanceRepositoryMock = {
    findByUserIdAndCurrencyForUpdate: jest.fn(),
    save: jest.fn(),
  };

  const ledgerRepositoryMock = {
    create: jest.fn(),
  };

  const auditLogRepositoryMock = {
    create: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    paymentProviderResolverMock.resolve.mockReturnValue(paymentProviderMock);

    useCase = new VerifyDepositUseCase(
      paymentProviderResolverMock as unknown as PaymentProviderResolver,
      unitOfWorkMock as unknown as UnitOfWork,
    );
  });

  function setupFirstTransaction(deposit: Deposit | null) {
    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        depositRepository: depositRepositoryMock,
      }),
    );

    depositRepositoryMock.findByUserIdAndIdForUpdate.mockResolvedValue(deposit);
  }

  function setupSecondTransaction() {
    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        depositRepository: depositRepositoryMock,
        userBalanceRepository: userBalanceRepositoryMock,
        ledgerRepository: ledgerRepositoryMock,
        auditLogRepository: auditLogRepositoryMock,
      }),
    );
  }

  it("should return already completed deposit without verifying it again", async () => {
    const deposit = {
      id: "deposit-1",
      userId: "user-1",
      status: DepositStatus.COMPLETED,
      providerPaymentId: "payment-1",
      referenceId: "reference-1",
      amount: "100",
      currency,
    } as Deposit;

    setupFirstTransaction(deposit);

    const result = await useCase.execute({
      userId: "user-1",
      depositId: "deposit-1",
    });

    expect(result).toBe(deposit);

    expect(paymentProviderResolverMock.resolve).not.toHaveBeenCalled();
    expect(paymentProviderMock.verifyPayment).not.toHaveBeenCalled();
  });

  it("should throw when the deposit does not exist", async () => {
    setupFirstTransaction(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(DepositNotFoundException);

    expect(paymentProviderResolverMock.resolve).not.toHaveBeenCalled();
    expect(paymentProviderMock.verifyPayment).not.toHaveBeenCalled();
  });

  it("should throw when provider payment ID is missing", async () => {
    const deposit = {
      id: "deposit-1",
      userId: "user-1",
      status: DepositStatus.PENDING,
      providerPaymentId: null,
      referenceId: "reference-1",
      amount: "100",
      currency,
    } as Deposit;

    setupFirstTransaction(deposit);

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);

    expect(paymentProviderResolverMock.resolve).not.toHaveBeenCalled();
    expect(paymentProviderMock.verifyPayment).not.toHaveBeenCalled();
  });

  it("should verify payment and complete the deposit", async () => {
    const deposit = {
      id: "deposit-1",
      userId: "user-1",
      status: DepositStatus.PENDING,
      providerPaymentId: "payment-1",
      referenceId: "reference-1",
      amount: "100",
      currency,
      markCompleted: jest.fn(function (this: Deposit) {
        this.status = DepositStatus.COMPLETED;
      }),
    } as unknown as Deposit;

    const balance = {
      id: "balance-1",
      userId: "user-1",
      currency,
      amount: "50",
    } as UserBalance;

    const savedBalance = {
      ...balance,
      amount: "150",
    } as UserBalance;

    const verification = {
      providerPaymentId: "payment-1",
      amount: "100",
      currency,
      transactionId: "transaction-1",
    };

    setupFirstTransaction(deposit);

    paymentProviderMock.verifyPayment.mockResolvedValue(verification);

    setupSecondTransaction();

    depositRepositoryMock.findByUserIdAndIdForUpdate.mockResolvedValue(deposit);

    userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    userBalanceRepositoryMock.save.mockResolvedValue(savedBalance);

    depositRepositoryMock.save.mockResolvedValue(deposit);

    ledgerRepositoryMock.create.mockImplementation(
      async (ledger: Ledger) => ledger,
    );

    auditLogRepositoryMock.create.mockImplementation(
      async (auditLog: AuditLog) => auditLog,
    );

    const result = await useCase.execute({
      userId: "user-1",
      depositId: "deposit-1",
    });

    expect(result).toBe(deposit);

    expect(paymentProviderResolverMock.resolve).toHaveBeenCalledTimes(1);

    expect(paymentProviderMock.verifyPayment).toHaveBeenCalledWith({
      providerPaymentId: "payment-1",
      referenceId: "reference-1",
      amount: "100",
      currency,
    });

    expect(
      userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate,
    ).toHaveBeenCalledWith("user-1", currency);

    expect(userBalanceRepositoryMock.save).toHaveBeenCalledWith(balance);

    expect(balance.amount).toBe("150");

    expect(ledgerRepositoryMock.create).toHaveBeenCalledTimes(1);

    const ledger = ledgerRepositoryMock.create.mock.calls[0][0];

    expect(ledger.userId).toBe("user-1");
    expect(ledger.currency).toBe(currency);
    expect(ledger.amount).toBe("100");
    expect(ledger.balanceBefore).toBe("50");
    expect(ledger.balanceAfter).toBe("150");
    expect(ledger.type).toBe(LedgerType.DEPOSIT);
    expect(ledger.referenceId).toBe("reference-1");

    expect(deposit.markCompleted).toHaveBeenCalledWith("transaction-1");

    expect(depositRepositoryMock.save).toHaveBeenCalledWith(deposit);

    expect(auditLogRepositoryMock.create).toHaveBeenCalledTimes(1);

    expect(auditLogRepositoryMock.create.mock.calls[0][0].action).toBe(
      AuditAction.DEPOSIT_COMPLETED,
    );
  });

  it("should throw when provider verification does not match the deposit", async () => {
    const deposit = {
      id: "deposit-1",
      userId: "user-1",
      status: DepositStatus.PENDING,
      providerPaymentId: "payment-1",
      referenceId: "reference-1",
      amount: "100",
      currency,
    } as Deposit;

    setupFirstTransaction(deposit);

    paymentProviderMock.verifyPayment.mockResolvedValue({
      providerPaymentId: "different-payment",
      amount: "100",
      currency,
      transactionId: "transaction-1",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);

    expect(userBalanceRepositoryMock.save).not.toHaveBeenCalled();
    expect(ledgerRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("should throw when the balance does not exist", async () => {
    const deposit = {
      id: "deposit-1",
      userId: "user-1",
      status: DepositStatus.PENDING,
      providerPaymentId: "payment-1",
      referenceId: "reference-1",
      amount: "100",
      currency,
    } as Deposit;

    setupFirstTransaction(deposit);

    paymentProviderMock.verifyPayment.mockResolvedValue({
      providerPaymentId: "payment-1",
      amount: "100",
      currency,
      transactionId: "transaction-1",
    });

    setupSecondTransaction();

    depositRepositoryMock.findByUserIdAndIdForUpdate.mockResolvedValue(deposit);

    userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(UserBalanceNotFoundException);

    expect(userBalanceRepositoryMock.save).not.toHaveBeenCalled();
    expect(ledgerRepositoryMock.create).not.toHaveBeenCalled();
    expect(depositRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("should not mutate the balance before a valid provider verification", async () => {
    const deposit = {
      id: "deposit-1",
      userId: "user-1",
      status: DepositStatus.PENDING,
      providerPaymentId: "payment-1",
      referenceId: "reference-1",
      amount: "100",
      currency,
    } as Deposit;

    setupFirstTransaction(deposit);

    paymentProviderMock.verifyPayment.mockResolvedValue({
      providerPaymentId: "payment-1",
      amount: "999",
      currency,
      transactionId: "transaction-1",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);

    expect(
      userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();

    expect(ledgerRepositoryMock.create).not.toHaveBeenCalled();
  });
});
