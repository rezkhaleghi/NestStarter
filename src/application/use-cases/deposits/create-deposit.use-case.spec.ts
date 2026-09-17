import { CreateDepositUseCase } from "./create-deposit.use-case";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

import {
  InvalidDepositAmountException,
  UnsupportedPaymentCurrencyException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { PaymentProviderResolver } from "@application/interfaces/payment-provider-resolver.interface";

describe("CreateDepositUseCase", () => {
  let useCase: CreateDepositUseCase;

  const currency = Object.values(PaymentCurrency)[0] as PaymentCurrency;

  const paymentProviderMock = {
    name: PaymentProvider.FAKE_PROVIDER,
    // Only support the currency used by the normal tests.
    supportedCurrencies: [currency],
    createPayment: jest.fn(),
    verifyPayment: jest.fn(),
  };

  const paymentProviderResolverMock = {
    resolve: jest.fn().mockReturnValue(paymentProviderMock),
  };

  const userRepositoryMock = {
    findById: jest.fn(),
  };

  const depositRepositoryMock = {
    create: jest.fn(),
    findByIdForUpdate: jest.fn(),
    save: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    paymentProviderResolverMock.resolve.mockReturnValue(paymentProviderMock);

    useCase = new CreateDepositUseCase(
      paymentProviderResolverMock as unknown as PaymentProviderResolver,
      unitOfWorkMock as unknown as UnitOfWork,
    );
  });

  it("should create a pending deposit and attach the provider payment ID", async () => {
    const input = {
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
    };

    const createdDeposit = {
      id: "deposit-1",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
      status: DepositStatus.PENDING,
      referenceId: "reference-1",
      providerPaymentId: null,
      setProviderPayment: jest.fn(function (
        this: Deposit & { providerPaymentId: string | null },
        providerPaymentId: string,
      ) {
        this.providerPaymentId = providerPaymentId;
      }),
    } as unknown as Deposit;

    const savedDeposit = {
      ...createdDeposit,
      providerPaymentId: "payment-123",
    } as Deposit;

    userRepositoryMock.findById.mockResolvedValue({
      id: "user-1",
    });

    depositRepositoryMock.create.mockResolvedValue(createdDeposit);
    depositRepositoryMock.findByIdForUpdate.mockResolvedValue(createdDeposit);
    depositRepositoryMock.save.mockResolvedValue(savedDeposit);

    paymentProviderMock.createPayment.mockResolvedValue({
      providerPaymentId: "payment-123",
    });

    unitOfWorkMock.execute
      .mockImplementationOnce(async (callback: any) =>
        callback({
          userRepository: userRepositoryMock,
          depositRepository: depositRepositoryMock,
        }),
      )
      .mockImplementationOnce(async (callback: any) =>
        callback({
          depositRepository: depositRepositoryMock,
        }),
      );

    const result = await useCase.execute(input);

    expect(result).toBe(savedDeposit);

    expect(paymentProviderResolverMock.resolve).toHaveBeenCalledWith(
      PaymentProvider.FAKE_PROVIDER,
    );

    expect(userRepositoryMock.findById).toHaveBeenCalledWith("user-1");

    expect(depositRepositoryMock.create).toHaveBeenCalledTimes(1);

    const depositArgument = depositRepositoryMock.create.mock.calls[0][0];

    expect(depositArgument.userId).toBe("user-1");
    expect(depositArgument.currency).toBe(currency);
    expect(depositArgument.amount).toBe("100");
    expect(depositArgument.provider).toBe(PaymentProvider.FAKE_PROVIDER);
    expect(depositArgument.status).toBe(DepositStatus.PENDING);

    expect(paymentProviderMock.createPayment).toHaveBeenCalledWith({
      amount: "100",
      currency,
      provider: PaymentProvider.FAKE_PROVIDER,
      referenceId: "reference-1",
      callbackUrl: "",
      idempotencyKey: "reference-1",
    });

    expect(depositRepositoryMock.findByIdForUpdate).toHaveBeenCalledWith(
      "deposit-1",
    );

    expect(depositRepositoryMock.save).toHaveBeenCalledWith(createdDeposit);

    expect(createdDeposit.providerPaymentId).toBe("payment-123");
  });

  it("should throw when the currency is not supported", async () => {
    const unsupportedCurrency = Object.values(PaymentCurrency).find(
      (value) => value !== currency,
    );

    if (unsupportedCurrency === undefined) {
      throw new Error(
        "PaymentCurrency must contain at least two currencies for this test",
      );
    }

    await expect(
      useCase.execute({
        userId: "user-1",
        currency: unsupportedCurrency,
        amount: "100",
        provider: PaymentProvider.FAKE_PROVIDER,
      }),
    ).rejects.toBeInstanceOf(UnsupportedPaymentCurrencyException);

    expect(paymentProviderResolverMock.resolve).toHaveBeenCalledWith(
      PaymentProvider.FAKE_PROVIDER,
    );

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });

  it("should throw when the amount is zero", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        currency,
        amount: "0",
        provider: PaymentProvider.FAKE_PROVIDER,
      }),
    ).rejects.toBeInstanceOf(InvalidDepositAmountException);

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });

  it("should throw when the amount is negative", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        currency,
        amount: "-10",
        provider: PaymentProvider.FAKE_PROVIDER,
      }),
    ).rejects.toBeInstanceOf(InvalidDepositAmountException);

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });

  it("should throw when the user does not exist", async () => {
    userRepositoryMock.findById.mockResolvedValue(null);

    unitOfWorkMock.execute.mockImplementation(async (callback: any) =>
      callback({
        userRepository: userRepositoryMock,
        depositRepository: depositRepositoryMock,
      }),
    );

    await expect(
      useCase.execute({
        userId: "missing-user",
        currency,
        amount: "100",
        provider: PaymentProvider.FAKE_PROVIDER,
      }),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(depositRepositoryMock.create).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });
});
