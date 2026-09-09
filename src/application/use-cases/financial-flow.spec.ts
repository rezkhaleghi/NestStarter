import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { randomUUID } from "crypto";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { User } from "@domain/entities/user.entity";
import { UserRole } from "@domain/enums/user-role.enum";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { Deposit } from "@domain/entities/deposit.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { CreateDepositUseCase } from "./deposits/create-deposit.use-case";
import { VerifyDepositUseCase } from "./deposits/verify-deposit.use-case";
import { CreateWithdrawalUseCase } from "./withdrawals/create-withdrawal.use-case";
import { ApproveWithdrawalUseCase } from "./withdrawals/approve-withdrawal.use-case";
import { RejectWithdrawalUseCase } from "./withdrawals/reject-withdrawal.use-case";

const makeUser = (id: string) =>
  User.create({
    id,
    email: `${id}@example.com`,
    hashedPassword: "hashed",
    role: UserRole.USER,
  });

describe("financial flows", () => {
  const userId = randomUUID();
  const adminId = randomUUID();
  const paymentProvider = {
    name: "FAKE",
    supportedCurrencies: [PaymentCurrency.USD, PaymentCurrency.USDT],
    createPayment: jest.fn(async () => ({
      provider: "FAKE" as any,
      providerPaymentId: "provider-payment-1",
      paymentUrl: "https://example.test/pay",
    })),
    verifyPayment: jest.fn(async () => ({
      providerPaymentId: "provider-payment-1",
      transactionId: "tx-1",
      amount: "100",
      currency: PaymentCurrency.USD,
    })),
    createWithdrawal: jest.fn(async () => ({
      provider: "FAKE" as any,
      providerWithdrawalId: "provider-withdrawal-1",
      status: "PROCESSING",
    })),
    getWithdrawalStatus: jest.fn(async () => ({
      providerWithdrawalId: "provider-withdrawal-1",
      status: "COMPLETED",
      transactionId: "withdrawal-tx-1",
    })),
  };

  const userRepository: any = {
    findById: jest.fn(async (id: string) => makeUser(id)),
    findByIdForUpdate: jest.fn(async (id: string) => makeUser(id)),
  };

  const userBalanceRepository: any = {
    findByUserIdAndCurrencyForUpdate: jest.fn(async () => ({
      id: randomUUID(),
      userId,
      currency: PaymentCurrency.USD,
      amount: "1000",
    })),
    save: jest.fn(async (balance: any) => balance),
    create: jest.fn(async (balance: any) => balance),
    findByUserIdAndCurrency: jest.fn(async () => ({
      id: randomUUID(),
      userId,
      currency: PaymentCurrency.USD,
      amount: "1000",
    })),
  };

  const ledgerRepository = {
    create: jest.fn(async (ledger: any) => ledger),
  };

  const auditLogRepository = {
    create: jest.fn(async (log: any) => log),
  };

  const depositRepository: any = {
    create: jest.fn(async (deposit: any) => deposit),
    save: jest.fn(async (deposit: any) => deposit),
    findById: jest.fn(async () => null),
    findByIdForUpdate: jest.fn(async () => null),
    findByReferenceId: jest.fn(async () => null),
  };

  const withdrawalRepository: any = {
    create: jest.fn(async (withdrawal: any) => withdrawal),
    save: jest.fn(async (withdrawal: any) => withdrawal),
    findById: jest.fn(async () => null),
    findByIdForUpdate: jest.fn(async () => null),
  };

  const unitOfWork = {
    execute: jest.fn(async (work: any) =>
      work({
        userRepository,
        userBalanceRepository,
        ledgerRepository,
        auditLogRepository,
        depositRepository,
        withdrawalRepository,
      }),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a pending deposit and verifies it into a balance increase", async () => {
    const depositUseCase = new CreateDepositUseCase(
      paymentProvider as any,
      unitOfWork as any,
    );

    const deposit = await depositUseCase.execute({
      userId,
      currency: PaymentCurrency.USD,
      amount: "100",
    });

    expect(deposit.status).toBe(DepositStatus.PENDING);
    expect(paymentProvider.createPayment).toHaveBeenCalled();

    const verifyUseCase = new VerifyDepositUseCase(
      paymentProvider as any,
      unitOfWork as any,
    );

    const hydratedDeposit = Deposit.create({
      id: deposit.id,
      userId,
      currency: PaymentCurrency.USD,
      amount: "100",
      status: DepositStatus.PENDING,
      referenceId: deposit.referenceId,
      providerPaymentId: "provider-payment-1",
      transactionId: null,
      completedAt: null,
    });

    depositRepository.findByIdForUpdate.mockResolvedValueOnce(hydratedDeposit);
    depositRepository.save.mockResolvedValueOnce(
      Object.assign(
        Object.create(Object.getPrototypeOf(hydratedDeposit)),
        hydratedDeposit,
        {
          status: DepositStatus.COMPLETED,
          transactionId: "tx-1",
          completedAt: new Date(),
        },
      ),
    );

    const verified = await verifyUseCase.execute({
      depositId: deposit.id,
      providerPaymentId: "provider-payment-1",
      referenceId: deposit.referenceId,
      amount: "100",
      currency: PaymentCurrency.USD,
    });

    expect(verified.status).toBe(DepositStatus.COMPLETED);
    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: LedgerType.DEPOSIT, amount: "100" }),
    );
  });

  it("creates a withdrawal and rejects it with a refund", async () => {
    const createUseCase = new CreateWithdrawalUseCase(unitOfWork as any);

    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValueOnce(
      {
        id: randomUUID(),
        userId,
        currency: PaymentCurrency.USD,
        amount: "1000",
      },
    );

    const withdrawal = await createUseCase.execute({
      userId,
      currency: PaymentCurrency.USD,
      amount: "300",
      destination: "wallet:abc",
    });

    expect(withdrawal.status).toBe(WithdrawalStatus.PENDING);
    expect(userBalanceRepository.save).toHaveBeenCalled();

    const approveUseCase = new ApproveWithdrawalUseCase(unitOfWork as any);
    const pendingWithdrawal = Withdrawal.create({
      id: withdrawal.id,
      userId,
      currency: PaymentCurrency.USD,
      amount: "300",
      status: WithdrawalStatus.PENDING,
      destination: "wallet:abc",
      referenceId: withdrawal.referenceId,
    });
    withdrawalRepository.findByIdForUpdate.mockResolvedValueOnce(
      pendingWithdrawal,
    );
    const approved = await approveUseCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: adminId,
    });
    expect(approved.status).toBe(WithdrawalStatus.APPROVED);

    const rejectUseCase = new RejectWithdrawalUseCase(unitOfWork as any);
    const rejectableWithdrawal = Withdrawal.create({
      id: approved.id,
      userId,
      currency: PaymentCurrency.USD,
      amount: "300",
      status: WithdrawalStatus.PENDING,
      destination: "wallet:abc",
      referenceId: approved.referenceId,
    });
    withdrawalRepository.findByIdForUpdate.mockResolvedValueOnce(
      rejectableWithdrawal,
    );
    const rejected = await rejectUseCase.execute({
      withdrawalId: withdrawal.id,
      adminUserId: adminId,
      reason: "Needs manual verification",
    });

    expect(rejected.status).toBe(WithdrawalStatus.REJECTED);
    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: LedgerType.REFUND, amount: "300" }),
    );
  });
});
