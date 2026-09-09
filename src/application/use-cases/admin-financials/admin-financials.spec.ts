import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { AuditAction } from "../../../domain/enums/audit-action.enum";
import { LedgerType } from "../../../domain/enums/ledger-type.enum";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "../../../domain/enums/withdrawal-status.enum";
import { User } from "../../../domain/entities/user.entity";
import { UserBalance } from "../../../domain/entities/user-balance.entity";
import { Withdrawal } from "../../../domain/entities/withdrawal.entity";
import { InsufficientBalanceException } from "../../../domain/exceptions/domain.exception";
import { ListLedgersUseCase } from "./list-ledgers.use-case";
import { UpdateUserBalanceUseCase } from "./update-user-balance.use-case";
import { AdminListDepositsUseCase } from "./list-deposits.use-case";
import { AdminGetDepositUseCase } from "./get-deposit.use-case";
import { AdminListWithdrawalsUseCase } from "./list-withdrawals.use-case";
import { AdminGetWithdrawalUseCase } from "./get-withdrawal.use-case";
import { AdminApproveWithdrawalUseCase } from "./approve-withdrawal.use-case";
import { AdminRejectWithdrawalUseCase } from "./reject-withdrawal.use-case";

const user = User.create({
  id: "user-id",
  email: "user@example.com",
  hashedPassword: "hashed",
});

const ledgerRepository = {
  searchAdminLedgers: jest.fn<() => Promise<any>>(),
  create: jest.fn<(value: unknown) => Promise<unknown>>(),
};
const depositRepository = {
  findById: jest.fn<() => Promise<any>>(),
  search: jest.fn<() => Promise<any>>(),
};
const withdrawalRepository = {
  findById: jest.fn<() => Promise<Withdrawal | null>>(),
  search: jest.fn<() => Promise<any>>(),
  findByIdForUpdate: jest.fn<() => Promise<Withdrawal | null>>(),
  save: jest.fn<(value: Withdrawal) => Promise<Withdrawal>>(),
};
const userRepository = {
  findById: jest.fn<() => Promise<User | null>>(),
  findByIdForUpdate: jest.fn<() => Promise<User | null>>(),
};
const userBalanceRepository = {
  findByUserIdAndCurrencyForUpdate:
    jest.fn<() => Promise<UserBalance | null>>(),
  save: jest.fn<(value: UserBalance) => Promise<UserBalance>>(),
  create: jest.fn<(value: UserBalance) => Promise<UserBalance>>(),
};
const auditLogRepository = {
  create: jest.fn<(value: unknown) => Promise<unknown>>(),
};
const unitOfWork = { execute: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  unitOfWork.execute.mockImplementation(
    async (work: (repositories: unknown) => Promise<unknown>) =>
      work({
        userRepository,
        userBalanceRepository,
        ledgerRepository,
        auditLogRepository,
        withdrawalRepository,
      }),
  );
  userRepository.findById.mockResolvedValue(user);
  userRepository.findByIdForUpdate.mockResolvedValue(user);
  userBalanceRepository.save.mockImplementation(
    async (value: UserBalance) => value,
  );
  userBalanceRepository.create.mockImplementation(
    async (value: UserBalance) => value,
  );
  withdrawalRepository.save.mockImplementation(
    async (value: Withdrawal) => value,
  );
  auditLogRepository.create.mockImplementation(async (value: unknown) => value);
});

describe("admin financial use cases", () => {
  it("lists admin ledgers with filters and pagination", async () => {
    const page = { data: [], page: 1, limit: 20, total: 0, totalPages: 0 };
    ledgerRepository.searchAdminLedgers.mockResolvedValue(page);

    await expect(
      new ListLedgersUseCase(ledgerRepository as any).execute({
        userId: user.id,
        currency: PaymentCurrency.USD,
        type: LedgerType.DEPOSIT,
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(page);

    expect(ledgerRepository.searchAdminLedgers).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        currency: PaymentCurrency.USD,
        type: LedgerType.DEPOSIT,
      }),
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it("updates a user balance and records an admin adjustment", async () => {
    const balance = UserBalance.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "25",
    });
    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    const result = await new UpdateUserBalanceUseCase(
      unitOfWork as any,
    ).execute(
      { userId: user.id, currency: PaymentCurrency.USD, amount: "75" },
      "admin-id",
    );

    expect(result).toBe(balance);
    expect(balance.amount).toBe("100");
    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: LedgerType.ADMIN_ADJUSTMENT }),
    );
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        action: AuditAction.USER_BALANCE_UPDATED,
      }),
    );
  });

  it("prevents admin balance adjustments from going negative", async () => {
    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      UserBalance.create({
        userId: user.id,
        currency: PaymentCurrency.USD,
        amount: "25",
      }),
    );

    await expect(
      new UpdateUserBalanceUseCase(unitOfWork as any).execute(
        { userId: user.id, currency: PaymentCurrency.USD, amount: "-50" },
        "admin-id",
      ),
    ).rejects.toBeInstanceOf(InsufficientBalanceException);
  });

  it("lists and gets admin deposits and withdrawals", async () => {
    const depositPage = {
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };
    const withdrawalPage = {
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };
    depositRepository.search.mockResolvedValue(depositPage);
    withdrawalRepository.search.mockResolvedValue(withdrawalPage);

    await expect(
      new AdminListDepositsUseCase(depositRepository as any).execute({
        page: 1,
        limit: 20,
      }),
    ).resolves.toBe(depositPage);
    await expect(
      new AdminListWithdrawalsUseCase(withdrawalRepository as any).execute({
        page: 1,
        limit: 20,
      }),
    ).resolves.toBe(withdrawalPage);
  });

  it("approves a pending withdrawal and audits the admin action", async () => {
    const withdrawal = Withdrawal.create({
      id: "withdrawal-id",
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
      status: WithdrawalStatus.PENDING,
    });
    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);

    const result = await new AdminApproveWithdrawalUseCase(
      unitOfWork as any,
    ).execute({ withdrawalId: withdrawal.id, adminUserId: "admin-id" });

    expect(result.status).toBe(WithdrawalStatus.APPROVED);
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-id",
        action: AuditAction.USER_UPDATED,
      }),
    );
  });

  it("rejects a pending withdrawal and refunds its balance", async () => {
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
    withdrawalRepository.findByIdForUpdate.mockResolvedValue(withdrawal);
    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    const result = await new AdminRejectWithdrawalUseCase(
      unitOfWork as any,
    ).execute({
      withdrawalId: withdrawal.id,
      adminUserId: "admin-id",
      reason: "Manual review failed",
    });

    expect(result.status).toBe(WithdrawalStatus.REJECTED);
    expect(balance.amount).toBe("100");
    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: LedgerType.REFUND }),
    );
  });

  it("gets admin financial records by id", async () => {
    const withdrawal = Withdrawal.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
    });
    depositRepository.findById.mockResolvedValue({ id: "deposit-id" });
    withdrawalRepository.findById.mockResolvedValue(withdrawal);

    await expect(
      new AdminGetDepositUseCase(depositRepository as any).execute(
        "deposit-id",
      ),
    ).resolves.toEqual({ id: "deposit-id" });
    await expect(
      new AdminGetWithdrawalUseCase(withdrawalRepository as any).execute(
        withdrawal.id,
      ),
    ).resolves.toBe(withdrawal);
  });
});
