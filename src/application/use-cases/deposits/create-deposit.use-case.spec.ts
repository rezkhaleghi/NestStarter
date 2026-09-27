import { CreateDepositUseCase } from "./create-deposit.use-case";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

import {
  DepositIdempotencyConflictException,
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
    findByUserIdAndIdempotencyKey: jest.fn(),
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

  const createInput = (
    overrides: Partial<{
      userId: string;
      currency: PaymentCurrency;
      amount: string;
      provider: PaymentProvider;
      idempotencyKey: string;
    }> = {},
  ) => ({
    userId: "user-1",
    currency,
    amount: "100",
    provider: PaymentProvider.FAKE_PROVIDER,
    idempotencyKey: "client-key-1",
    ...overrides,
  });

  const setupFirstTransaction = ({
    existingDeposit = null,
    user = { id: "user-1" },
  }: {
    existingDeposit?: Deposit | null;
    user?: unknown;
  } = {}) => {
    userRepositoryMock.findById.mockResolvedValue(user);
    depositRepositoryMock.findByUserIdAndIdempotencyKey.mockResolvedValue(
      existingDeposit,
    );

    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        userRepository: userRepositoryMock,
        depositRepository: depositRepositoryMock,
      }),
    );
  };

  const setupSecondTransaction = (currentDeposit: Deposit) => {
    depositRepositoryMock.findByIdForUpdate.mockResolvedValue(currentDeposit);

    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        depositRepository: depositRepositoryMock,
      }),
    );
  };

  it("should create a pending deposit and attach the provider payment ID", async () => {
    const input = createInput();

    const createdDeposit = {
      id: "deposit-1",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
      status: DepositStatus.PENDING,
      referenceId: "reference-1",
      idempotencyKey: "client-key-1",
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

    depositRepositoryMock.findByUserIdAndIdempotencyKey.mockResolvedValue(null);
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

    expect(
      depositRepositoryMock.findByUserIdAndIdempotencyKey,
    ).toHaveBeenCalledWith("user-1", "client-key-1");

    expect(userRepositoryMock.findById).toHaveBeenCalledWith("user-1");

    expect(depositRepositoryMock.create).toHaveBeenCalledTimes(1);

    const depositArgument = depositRepositoryMock.create.mock.calls[0][0];

    expect(depositArgument.userId).toBe("user-1");
    expect(depositArgument.currency).toBe(currency);
    expect(depositArgument.amount).toBe("100");
    expect(depositArgument.provider).toBe(PaymentProvider.FAKE_PROVIDER);
    expect(depositArgument.status).toBe(DepositStatus.PENDING);
    expect(depositArgument.idempotencyKey).toBe("client-key-1");

    expect(paymentProviderMock.createPayment).toHaveBeenCalledWith({
      amount: "100",
      currency,
      provider: PaymentProvider.FAKE_PROVIDER,
      referenceId: "reference-1",
      callbackUrl: "",
      idempotencyKey: "client-key-1",
    });

    expect(depositRepositoryMock.findByIdForUpdate).toHaveBeenCalledWith(
      "deposit-1",
    );

    expect(depositRepositoryMock.save).toHaveBeenCalledWith(createdDeposit);

    expect(createdDeposit.providerPaymentId).toBe("payment-123");
  });

  it("should return the existing deposit for the same idempotency key and parameters", async () => {
    const input = createInput();

    const existingDeposit = {
      id: "deposit-existing",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
      status: DepositStatus.PENDING,
      idempotencyKey: "client-key-1",
      providerPaymentId: "payment-existing",
    } as unknown as Deposit;

    setupFirstTransaction({
      existingDeposit,
    });

    const result = await useCase.execute(input);

    expect(result).toBe(existingDeposit);

    expect(depositRepositoryMock.create).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();

    // Returning the existing deposit must not open another transaction.
    expect(unitOfWorkMock.execute).toHaveBeenCalledTimes(1);
  });

  it("should reject reuse of an idempotency key with different parameters", async () => {
    const existingDeposit = {
      id: "deposit-existing",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
      status: DepositStatus.PENDING,
      idempotencyKey: "client-key-1",
      providerPaymentId: "payment-existing",
    } as unknown as Deposit;

    setupFirstTransaction({
      existingDeposit,
    });

    await expect(
      useCase.execute(
        createInput({
          amount: "250",
        }),
      ),
    ).rejects.toBeInstanceOf(DepositIdempotencyConflictException);

    expect(depositRepositoryMock.create).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });

  it("should resume an existing pending deposit when it has no provider payment ID", async () => {
    const input = createInput();

    const existingDeposit = {
      id: "deposit-existing",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
      status: DepositStatus.PENDING,
      referenceId: "reference-existing",
      idempotencyKey: "client-key-1",
      providerPaymentId: null,
      setProviderPayment: jest.fn(function (
        this: Deposit & { providerPaymentId: string | null },
        providerPaymentId: string,
      ) {
        this.providerPaymentId = providerPaymentId;
      }),
    } as unknown as Deposit;

    const savedDeposit = {
      ...existingDeposit,
      providerPaymentId: "payment-recovered",
    } as Deposit;

    setupFirstTransaction({
      existingDeposit,
    });

    depositRepositoryMock.findByIdForUpdate.mockResolvedValue(existingDeposit);
    depositRepositoryMock.save.mockResolvedValue(savedDeposit);

    paymentProviderMock.createPayment.mockResolvedValue({
      providerPaymentId: "payment-recovered",
    });

    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        depositRepository: depositRepositoryMock,
      }),
    );

    const result = await useCase.execute(input);

    expect(result).toBe(savedDeposit);

    expect(depositRepositoryMock.create).not.toHaveBeenCalled();

    expect(paymentProviderMock.createPayment).toHaveBeenCalledWith({
      amount: "100",
      currency,
      provider: PaymentProvider.FAKE_PROVIDER,
      referenceId: "reference-existing",
      callbackUrl: "",
      idempotencyKey: "client-key-1",
    });

    expect(existingDeposit.setProviderPayment).toHaveBeenCalledWith(
      "payment-recovered",
    );
  });

  it("should not overwrite a provider payment ID attached by another request", async () => {
    const input = createInput();

    const existingDeposit = {
      id: "deposit-existing",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
      status: DepositStatus.PENDING,
      referenceId: "reference-existing",
      idempotencyKey: "client-key-1",
      providerPaymentId: null,
    } as unknown as Deposit;

    const concurrentlyUpdatedDeposit = {
      ...existingDeposit,
      providerPaymentId: "payment-from-other-request",
    } as Deposit;

    setupFirstTransaction({
      existingDeposit,
    });

    paymentProviderMock.createPayment.mockResolvedValue({
      providerPaymentId: "payment-from-this-request",
    });

    depositRepositoryMock.findByIdForUpdate.mockResolvedValue(
      concurrentlyUpdatedDeposit,
    );

    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        depositRepository: depositRepositoryMock,
      }),
    );

    const result = await useCase.execute(input);

    expect(result).toBe(concurrentlyUpdatedDeposit);

    expect(depositRepositoryMock.save).not.toHaveBeenCalled();

    expect(concurrentlyUpdatedDeposit.providerPaymentId).toBe(
      "payment-from-other-request",
    );
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
      useCase.execute(
        createInput({
          currency: unsupportedCurrency,
        }),
      ),
    ).rejects.toBeInstanceOf(UnsupportedPaymentCurrencyException);

    expect(paymentProviderResolverMock.resolve).toHaveBeenCalledWith(
      PaymentProvider.FAKE_PROVIDER,
    );

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });

  it("should throw when the amount is zero", async () => {
    await expect(
      useCase.execute(
        createInput({
          amount: "0",
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidDepositAmountException);

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });

  it("should throw when the amount is negative", async () => {
    await expect(
      useCase.execute(
        createInput({
          amount: "-10",
        }),
      ),
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
      useCase.execute(
        createInput({
          userId: "missing-user",
        }),
      ),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(userRepositoryMock.findById).toHaveBeenCalledWith("missing-user");

    expect(
      depositRepositoryMock.findByUserIdAndIdempotencyKey,
    ).not.toHaveBeenCalled();

    expect(depositRepositoryMock.create).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });
});
