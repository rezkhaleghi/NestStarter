import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { GetWithdrawalUseCase } from "./get-withdrawal.use-case";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";
import { WithdrawalNotFoundException } from "@domain/exceptions/domain.exception";

describe("GetWithdrawalUseCase", () => {
  let useCase: GetWithdrawalUseCase;

  const withdrawalRepository = {
    findByUserIdAndId: jest.fn<() => Promise<Withdrawal | null>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new GetWithdrawalUseCase(
      withdrawalRepository as unknown as WithdrawalRepository,
    );
  });

  it("should return the withdrawal when it exists", async () => {
    const withdrawal = Withdrawal.create({
      id: "withdrawal-1",
      userId: "user-1",
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
    });

    withdrawalRepository.findByUserIdAndId.mockResolvedValue(withdrawal);

    const result = await useCase.execute({
      userId: "user-1",
      id: "withdrawal-1",
    });

    expect(result).toBe(withdrawal);

    expect(withdrawalRepository.findByUserIdAndId).toHaveBeenCalledWith(
      "user-1",
      "withdrawal-1",
    );
  });

  it("should throw WithdrawalNotFoundException when the withdrawal does not exist", async () => {
    withdrawalRepository.findByUserIdAndId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        id: "withdrawal-1",
      }),
    ).rejects.toBeInstanceOf(WithdrawalNotFoundException);
  });
});
