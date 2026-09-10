import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { Deposit } from "../../../domain/entities/deposit.entity";
import { User } from "../../../domain/entities/user.entity";
import { UserBalance } from "../../../domain/entities/user-balance.entity";

import { AuditAction } from "../../../domain/enums/audit-action.enum";
import { DepositStatus } from "../../../domain/enums/deposit-status.enum";
import { LedgerType } from "../../../domain/enums/ledger-type.enum";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";

import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";

import { CreateDepositUseCase } from "./create-deposit.use-case";
import { VerifyDepositUseCase } from "./verify-deposit.use-case";
import { GetDepositUseCase } from "./get-deposit.use-case";
import { ListDepositsUseCase } from "./list-deposits.use-case";

const user = User.create({
  id: "user-id",
  email: "user@example.com",
  hashedPassword: "hashed",
});

const provider = {
  name: "NOWPAYMENTS" as any,
  supportedCurrencies: [PaymentCurrency.USD],
  createPayment: jest.fn<() => Promise<unknown>>(),
  verifyPayment: jest.fn<() => Promise<unknown>>(),
};

const depositRepository = {
  create: jest.fn<(value: unknown) => Promise<unknown>>(),
  save: jest.fn<(value: unknown) => Promise<unknown>>(),
  findById: jest.fn<() => Promise<Deposit | null>>(),
  findByIdForUpdate: jest.fn<() => Promise<Deposit | null>>(),
  search: jest.fn<() => Promise<unknown>>(),
};

const userRepository = {
  findById: jest.fn<() => Promise<User | null>>(),
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

beforeEach(() => {
  jest.clearAllMocks();

  unitOfWork.execute.mockImplementation(
    async (work: (repositories: unknown) => Promise<unknown>) =>
      work({
        userRepository,
        depositRepository,
        userBalanceRepository,
        ledgerRepository,
        auditLogRepository,
      }),
  );

  userRepository.findById.mockResolvedValue(user);

  depositRepository.create.mockImplementation(async (value: unknown) => value);

  depositRepository.save.mockImplementation(async (value: unknown) => value);

  userBalanceRepository.save.mockImplementation(
    async (value: UserBalance) => value,
  );

  provider.createPayment.mockResolvedValue({
    provider: provider.name,
    providerPaymentId: "provider-payment-id",
    paymentUrl: "https://fake-payment.example/pay",
  });
});

describe("deposit use cases", () => {
  it("creates a pending deposit and provider payment", async () => {
    const result = await new CreateDepositUseCase(
      provider as any,
      unitOfWork as any,
    ).execute({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "100",
    });

    expect(result.status).toBe(DepositStatus.PENDING);
    expect(result.providerPaymentId).toBe("provider-payment-id");

    expect(provider.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "100",
        currency: PaymentCurrency.USD,
        referenceId: result.referenceId,
      }),
    );

    expect(depositRepository.create).toHaveBeenCalledWith(result);
  });

  it("rejects deposits for missing users", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      new CreateDepositUseCase(provider as any, unitOfWork as any).execute({
        userId: "missing",
        currency: PaymentCurrency.USD,
        amount: "100",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(provider.createPayment).not.toHaveBeenCalled();
  });

  it("verifies a deposit, credits balance, and writes ledger and audit records", async () => {
    const deposit = Deposit.create({
      id: "deposit-id",
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "100",
      referenceId: "reference-id",
      providerPaymentId: "provider-payment-id",
    });

    const balance = UserBalance.create({
      id: "balance-id",
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "25",
    });

    depositRepository.findByIdForUpdate.mockResolvedValue(deposit);

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    provider.verifyPayment.mockResolvedValue({
      providerPaymentId: "provider-payment-id",
      transactionId: "transaction-id",
      amount: "100",
      currency: PaymentCurrency.USD,
    });

    const result = await new VerifyDepositUseCase(
      provider as any,
      unitOfWork as any,
    ).execute({
      depositId: deposit.id,
      providerPaymentId: "provider-payment-id",
      referenceId: "reference-id",
      amount: "100",
      currency: PaymentCurrency.USD,
    });

    expect(result.status).toBe(DepositStatus.COMPLETED);
    expect(balance.amount).toBe("125");

    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "100",
        type: LedgerType.DEPOSIT,
        balanceBefore: "25",
        balanceAfter: "125",
      }),
    );

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.USER_BALANCE_UPDATED,
      }),
    );
  });

  it("does not verify or credit an already completed deposit", async () => {
    const deposit = Deposit.create({
      id: "deposit-id",
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "100",
      referenceId: "reference-id",
      providerPaymentId: "provider-payment-id",
    });

    deposit.markCompleted("transaction-id");

    depositRepository.findByIdForUpdate.mockResolvedValue(deposit);

    const result = await new VerifyDepositUseCase(
      provider as any,
      unitOfWork as any,
    ).execute({
      depositId: deposit.id,
      providerPaymentId: "provider-payment-id",
      referenceId: "reference-id",
      amount: "100",
      currency: PaymentCurrency.USD,
    });

    expect(result.status).toBe(DepositStatus.COMPLETED);

    expect(provider.verifyPayment).not.toHaveBeenCalled();
    expect(
      userBalanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();
    expect(userBalanceRepository.save).not.toHaveBeenCalled();
    expect(ledgerRepository.create).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("lists and gets deposits through their repositories", async () => {
    const deposit = Deposit.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "100",
    });

    const page = {
      data: [deposit],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    };

    depositRepository.findById.mockResolvedValue(deposit);
    depositRepository.search.mockResolvedValue(page);

    await expect(
      new GetDepositUseCase(depositRepository as any).execute(deposit.id),
    ).resolves.toBe(deposit);

    await expect(
      new ListDepositsUseCase(depositRepository as any).execute({
        userId: user.id,
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(page);
  });
});
