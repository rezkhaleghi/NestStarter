import { describe, expect, it, jest } from "@jest/globals";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { User } from "@domain/entities/user.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { InsufficientBalanceException } from "@domain/exceptions/domain.exception";
import { UpdateUserBalanceUseCase } from "./update-user-balance.use-case";

describe("UpdateUserBalanceUseCase", () => {
  const user = User.create({
    id: "user-id",
    email: "user@example.com",
    hashedPassword: "hashed",
  });

  const userBalanceRepository = {
    findByUserIdAndCurrencyForUpdate:
      jest.fn<() => Promise<UserBalance | null>>(),
    save: jest.fn<(value: UserBalance) => Promise<UserBalance>>(),
    create: jest.fn<(value: UserBalance) => Promise<UserBalance>>(),
  };

  const ledgerRepository = {
    create: jest.fn<(value: unknown) => Promise<unknown>>(),
  };

  const auditLogRepository = {
    create: jest.fn<(value: unknown) => Promise<unknown>>(),
  };

  const userRepository = {
    findById: jest.fn<() => Promise<User | null>>(),
    findByIdForUpdate: jest.fn<() => Promise<User | null>>(),
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
          userBalanceRepository,
          ledgerRepository,
          auditLogRepository,
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

    auditLogRepository.create.mockImplementation(
      async (value: unknown) => value,
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
      {
        userId: user.id,
        currency: PaymentCurrency.USD,
        amount: "75",
      },
      "admin-id",
    );

    expect(result).toBe(balance);
    expect(balance.amount).toBe("100");

    expect(ledgerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: LedgerType.ADMIN_ADJUSTMENT,
      }),
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
        {
          userId: user.id,
          currency: PaymentCurrency.USD,
          amount: "-50",
        },
        "admin-id",
      ),
    ).rejects.toBeInstanceOf(InsufficientBalanceException);
  });
});
