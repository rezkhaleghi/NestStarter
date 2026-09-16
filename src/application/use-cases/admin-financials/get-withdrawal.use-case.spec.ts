import { describe, expect, it, jest } from "@jest/globals";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { User } from "@domain/entities/user.entity";
import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { AdminGetWithdrawalUseCase } from "./get-withdrawal.use-case";

describe("AdminGetWithdrawalUseCase", () => {
  it("gets a withdrawal by id", async () => {
    const repository = {
      findById: jest.fn<() => Promise<Withdrawal | null>>(),
    };

    const user = User.create({
      id: "user-id",
      email: "user@example.com",
      hashedPassword: "hashed",
    });

    const withdrawal = Withdrawal.create({
      userId: user.id,
      currency: PaymentCurrency.USD,
      amount: "50",
      destination: "wallet:abc123",
    });

    repository.findById.mockResolvedValue(withdrawal);

    const result = await new AdminGetWithdrawalUseCase(
      repository as any,
    ).execute(withdrawal.id);

    expect(result).toBe(withdrawal);
    expect(repository.findById).toHaveBeenCalledWith(withdrawal.id);
  });
});
