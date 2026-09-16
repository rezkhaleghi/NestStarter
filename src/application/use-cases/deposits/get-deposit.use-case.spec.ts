import { GetDepositUseCase } from "./get-deposit.use-case";

import { Deposit } from "@domain/entities/deposit.entity";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { DepositNotFoundException } from "@domain/exceptions/domain.exception";

describe("GetDepositUseCase", () => {
  let useCase: GetDepositUseCase;

  const depositRepositoryMock = {
    findByUserIdAndId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new GetDepositUseCase(
      depositRepositoryMock as unknown as DepositRepository,
    );
  });

  it("should return the user's deposit", async () => {
    const deposit = {
      id: "deposit-1",
      userId: "user-1",
    } as Deposit;

    depositRepositoryMock.findByUserIdAndId.mockResolvedValue(deposit);

    const result = await useCase.execute({
      userId: "user-1",
      id: "deposit-1",
    });

    expect(result).toBe(deposit);

    expect(depositRepositoryMock.findByUserIdAndId).toHaveBeenCalledWith(
      "user-1",
      "deposit-1",
    );
  });

  it("should throw when the deposit does not exist", async () => {
    depositRepositoryMock.findByUserIdAndId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        id: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(DepositNotFoundException);
  });
});
