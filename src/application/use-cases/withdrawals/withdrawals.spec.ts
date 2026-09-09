import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { Withdrawal } from "../../../domain/entities/withdrawal.entity";
import { User } from "../../../domain/entities/user.entity";
import { UserBalance } from "../../../domain/entities/user-balance.entity";
import { WithdrawalStatus } from "../../../domain/enums/withdrawal-status.enum";
import { LedgerType } from "../../../domain/enums/ledger-type.enum";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import {
  InsufficientBalanceException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";
import { CreateWithdrawalUseCase } from "./create-withdrawal.use-case";
import { GetWithdrawalUseCase } from "./get-withdrawal.use-case";
import { ListWithdrawalsUseCase } from "./list-withdrawals.use-case";

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
  save: jest.fn<(value: UserBalance) => Promise<UserBalance>>(),
};
const withdrawalRepository = {
  create: jest.fn<(value: unknown) => Promise<unknown>>(),
  findById: jest.fn<() => Promise<Withdrawal | null>>(),
  search: jest.fn<() => Promise<unknown>>(),
};
const ledgerRepository = {
  create: jest.fn<(value: unknown) => Promise<unknown>>(),
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
        withdrawalRepository,
        ledgerRepository,
        auditLogRepository,
      }),
  );
  userRepository.findById.mockResolvedValue(user);
  userBalanceRepository.save.mockImplementation(
    async (value: UserBalance) => value,
  );
  withdrawalRepository.create.mockImplementation(
    async (value: unknown) => value,
  );
});

describe("withdrawal use cases", () => {
  it("deducts the balance and creates a pending withdrawal", async () => {
    const balance = UserBalance.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "150",
    });
    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    const result = await new CreateWithdrawalUseCase(unitOfWork as any).execute(
      {
        userId: user.id,
        currency: PaymentCurrency.USD,
        amount: "50",
        destination: "wallet:abc123",
      },
    );

    expect(result.status).toBe(WithdrawalStatus.PENDING);
    expect(result.destination).toBe("wallet:abc123");
    expect(balance.amount).toBe("100");
    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "-50",
        type: LedgerType.WITHDRAWAL,
      }),
    );
  });

  it("rejects withdrawals when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      new CreateWithdrawalUseCase(unitOfWork as any).execute({
        userId: "missing",
        currency: PaymentCurrency.USD,
        amount: "50",
        destination: "wallet:abc123",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it("rejects withdrawals that exceed the balance", async () => {
    const balance = UserBalance.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "25",
    });
    userBalanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    await expect(
      new CreateWithdrawalUseCase(unitOfWork as any).execute({
        userId: user.id,
        currency: PaymentCurrency.USD,
        amount: "50",
        destination: "wallet:abc123",
      }),
    ).rejects.toBeInstanceOf(InsufficientBalanceException);

    expect(withdrawalRepository.create).not.toHaveBeenCalled();
    expect(ledgerRepository.create).not.toHaveBeenCalled();
  });

  it("lists and gets withdrawals through their repositories", async () => {
    const withdrawal = Withdrawal.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
    });
    const page = {
      data: [withdrawal],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    };
    withdrawalRepository.findById.mockResolvedValue(withdrawal);
    withdrawalRepository.search.mockResolvedValue(page);

    await expect(
      new GetWithdrawalUseCase(withdrawalRepository as any).execute(
        withdrawal.id,
      ),
    ).resolves.toBe(withdrawal);
    await expect(
      new ListWithdrawalsUseCase(withdrawalRepository as any).execute({
        userId: user.id,
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(page);
  });
});
