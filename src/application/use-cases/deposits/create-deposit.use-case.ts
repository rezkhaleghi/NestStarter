import { Inject, Injectable } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import {
  DepositNotFoundException,
  InvalidDepositAmountException,
  UnsupportedPaymentCurrencyException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";
import {
  PaymentProviderResolver,
  PAYMENT_PROVIDER_RESOLVER,
} from "@application/interfaces/payment-provider-resolver.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { isNegativeDecimal, isZeroDecimal } from "@domain/utils/decimal.util";

export interface CreateDepositInput {
  userId: string;
  provider: PaymentProvider;
  currency: PaymentCurrency;
  amount: string;
}

@Injectable()
export class CreateDepositUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER_RESOLVER)
    private readonly paymentProviderResolver: PaymentProviderResolver,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CreateDepositInput): Promise<Deposit> {
    // Resolve the provider selected by the user.
    const paymentProvider = this.paymentProviderResolver.resolve(
      input.provider,
    );

    // Ensure the selected provider supports the requested currency.
    if (!paymentProvider.supportedCurrencies.includes(input.currency)) {
      throw new UnsupportedPaymentCurrencyException(input.currency);
    }

    // Money amounts must be greater than zero.
    if (isNegativeDecimal(input.amount) || isZeroDecimal(input.amount)) {
      throw new InvalidDepositAmountException();
    }

    // Create the pending deposit before requesting payment externally.
    const deposit = await this.unitOfWork.execute(
      async ({ userRepository, depositRepository }) => {
        const user = await userRepository.findById(input.userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        const newDeposit = Deposit.create({
          userId: input.userId,
          provider: input.provider,
          currency: input.currency,
          amount: input.amount,
          status: DepositStatus.PENDING,
        });

        return depositRepository.create(newDeposit);
      },
    );

    // Request payment from the resolved provider.
    const payment = await paymentProvider.createPayment({
      amount: deposit.amount,
      currency: deposit.currency,
      provider: deposit.provider,
      referenceId: deposit.referenceId,
      callbackUrl: "",
      idempotencyKey: deposit.referenceId,
    });

    // Save the provider's payment ID for later verification.
    return this.unitOfWork.execute(async ({ depositRepository }) => {
      const currentDeposit = await depositRepository.findByIdForUpdate(
        deposit.id,
      );

      if (!currentDeposit) {
        throw new DepositNotFoundException();
      }

      currentDeposit.setProviderPayment(payment.providerPaymentId);

      return depositRepository.save(currentDeposit);
    });
  }
}
