import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import {
  InvalidDepositAmountException,
  UnsupportedPaymentCurrencyException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";
import {
  PAYMENT_PROVIDER,
  PaymentProviderInterface,
} from "@application/interfaces/payment-provider.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { isNegativeDecimal, isZeroDecimal } from "@domain/utils/decimal.util";

export interface CreateDepositInput {
  userId: string;
  currency: PaymentCurrency;
  amount: string;
}

@Injectable()
export class CreateDepositUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProviderInterface,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CreateDepositInput): Promise<Deposit> {
    return this.unitOfWork.execute(
      async ({ userRepository, depositRepository }) => {
        const user = await userRepository.findById(input.userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        if (
          !this.paymentProvider.supportedCurrencies.includes(input.currency)
        ) {
          throw new UnsupportedPaymentCurrencyException(input.currency);
        }

        if (isNegativeDecimal(input.amount) || isZeroDecimal(input.amount)) {
          throw new InvalidDepositAmountException();
        }

        const deposit = Deposit.create({
          id: randomUUID(),
          userId: input.userId,
          currency: input.currency,
          amount: input.amount,
          status: DepositStatus.PENDING,
          referenceId: randomUUID(),
        });

        const payment = await this.paymentProvider.createPayment({
          amount: deposit.amount,
          currency: deposit.currency,
          provider: this.paymentProvider.name,
          referenceId: deposit.referenceId,
          callbackUrl: "",
        });

        deposit.setProviderPayment(payment.providerPaymentId);

        return depositRepository.create(deposit);
      },
    );
  }
}
