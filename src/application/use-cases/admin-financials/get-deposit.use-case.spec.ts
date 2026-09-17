import { AdminGetDepositUseCase } from "./get-deposit.use-case";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { DepositNotFoundException } from "@domain/exceptions/domain.exception";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

describe("AdminGetDepositUseCase", () => {
  let useCase: AdminGetDepositUseCase;

  const depositRepository = {
    findById: jest.fn<Promise<Deposit | null>, [string]>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new AdminGetDepositUseCase(
      depositRepository as unknown as DepositRepository,
    );
  });

  it("should return the deposit when it exists", async () => {
    const deposit = Deposit.create({
      id: "deposit-1",
      userId: "user-1",
      currency: PaymentCurrency.USDT,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
    });

    depositRepository.findById.mockResolvedValue(deposit);

    const result = await useCase.execute("deposit-1");

    expect(result).toBe(deposit);
    expect(depositRepository.findById).toHaveBeenCalledWith("deposit-1");
  });

  it("should throw DepositNotFoundException when the deposit does not exist", async () => {
    depositRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("deposit-1")).rejects.toBeInstanceOf(
      DepositNotFoundException,
    );

    expect(depositRepository.findById).toHaveBeenCalledWith("deposit-1");
  });
});
