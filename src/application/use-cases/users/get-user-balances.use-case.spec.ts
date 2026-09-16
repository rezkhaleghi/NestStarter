import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { GetUserBalancesUseCase } from "./get-user-balances.use-case";

import { User } from "@domain/entities/user.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

import { UserRepository } from "@domain/repositories/user.repository";
import { UserBalanceRepository } from "@domain/repositories/user-balance.repository";

import { UserNotFoundException } from "@domain/exceptions/domain.exception";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

describe("GetUserBalancesUseCase", () => {
  let useCase: GetUserBalancesUseCase;

  const userRepository = {
    findById: jest.fn<() => Promise<User | null>>(),
  };

  const userBalanceRepository = {
    findByUserId: jest.fn<() => Promise<PageResult<UserBalance>>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new GetUserBalancesUseCase(
      userRepository as unknown as UserRepository,
      userBalanceRepository as unknown as UserBalanceRepository,
    );
  });

  it("should return the user's balances", async () => {
    const user = User.create({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    const balance = UserBalance.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "100",
    });

    const query: PageQuery<"currency" | "amount" | "createdAt"> = {
      page: 1,
      limit: 20,
      sortBy: "currency",
      sortDirection: "ASC",
    };

    const result: PageResult<UserBalance> = {
      data: [balance],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    };

    userRepository.findById.mockResolvedValue(user);
    userBalanceRepository.findByUserId.mockResolvedValue(result);

    const response = await useCase.execute("user-1", query);

    expect(response).toBe(result);

    expect(userRepository.findById).toHaveBeenCalledWith("user-1");

    expect(userBalanceRepository.findByUserId).toHaveBeenCalledWith(
      "user-1",
      query,
    );
  });

  it("should throw UserNotFoundException when the user does not exist", async () => {
    const query: PageQuery<"currency" | "amount" | "createdAt"> = {
      page: 1,
      limit: 20,
      sortBy: "currency",
      sortDirection: "ASC",
    };

    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing-user", query)).rejects.toBeInstanceOf(
      UserNotFoundException,
    );

    expect(userBalanceRepository.findByUserId).not.toHaveBeenCalled();
  });
});
