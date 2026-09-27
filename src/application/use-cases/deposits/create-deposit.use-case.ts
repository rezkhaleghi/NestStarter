import { Inject, Injectable } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import {
  DepositIdempotencyConflictException,
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
  idempotencyKey: string;
}

@Injectable()
export class CreateDepositUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER_RESOLVER)
    private readonly paymentProviderResolver: PaymentProviderResolver,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CreateDepositInput): Promise<Deposit> {
    const paymentProvider = this.paymentProviderResolver.resolve(
      input.provider,
    );

    if (!paymentProvider.supportedCurrencies.includes(input.currency)) {
      throw new UnsupportedPaymentCurrencyException(input.currency);
    }

    if (isNegativeDecimal(input.amount) || isZeroDecimal(input.amount)) {
      throw new InvalidDepositAmountException();
    }

    /*
     * The idempotency lookup and creation happen inside the same database
     * transaction. The database unique constraint remains the final
     * concurrency guard when two requests reach INSERT simultaneously.
     */
    const deposit = await this.unitOfWork.execute(
      async ({ userRepository, depositRepository }) => {
        const user = await userRepository.findById(input.userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        const existing = await depositRepository.findByUserIdAndIdempotencyKey(
          input.userId,
          input.idempotencyKey,
        );

        if (existing) {
          this.assertSameIdempotentRequest(existing, input);

          return existing;
        }

        const newDeposit = Deposit.create({
          userId: input.userId,
          provider: input.provider,
          currency: input.currency,
          amount: input.amount,
          status: DepositStatus.PENDING,
          idempotencyKey: input.idempotencyKey,
        });

        /*
         * If another concurrent request wins the unique constraint race,
         * DepositRepositoryImpl.create() returns that existing deposit
         * instead of exposing the database error.
         */
        const created = await depositRepository.create(newDeposit);

        this.assertSameIdempotentRequest(created, input);

        return created;
      },
    );

    /*
     * A retry may reach this point with a deposit that already has a
     * provider payment ID. Never create another external payment in that
     * case.
     */
    if (deposit.providerPaymentId) {
      return deposit;
    }

    const payment = await paymentProvider.createPayment({
      amount: deposit.amount,
      currency: deposit.currency,
      provider: deposit.provider,
      referenceId: deposit.referenceId,
      callbackUrl: "",
      idempotencyKey: input.idempotencyKey,
    });

    /*
     * Another request may have attached the provider payment while this
     * request was waiting on the external provider. Lock before writing and
     * never overwrite the winner's provider payment ID.
     */
    return this.unitOfWork.execute(async ({ depositRepository }) => {
      const currentDeposit = await depositRepository.findByIdForUpdate(
        deposit.id,
      );

      if (!currentDeposit) {
        throw new DepositNotFoundException();
      }

      if (currentDeposit.providerPaymentId) {
        return currentDeposit;
      }

      currentDeposit.setProviderPayment(payment.providerPaymentId);

      return depositRepository.save(currentDeposit);
    });
  }

  private assertSameIdempotentRequest(
    existing: Deposit,
    input: CreateDepositInput,
  ): void {
    const sameRequest =
      existing.provider === input.provider &&
      existing.currency === input.currency &&
      existing.amount === input.amount &&
      existing.idempotencyKey === input.idempotencyKey;

    if (!sameRequest) {
      throw new DepositIdempotencyConflictException();
    }
  }
}
