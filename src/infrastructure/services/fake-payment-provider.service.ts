import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";

import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderInterface,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@application/interfaces/payment-provider.interface";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

@Injectable()
export class FakePaymentProvider implements PaymentProviderInterface {
  readonly name = PaymentProvider.FAKE_PROVIDER;
  readonly supportedCurrencies = [PaymentCurrency.USD, PaymentCurrency.IRR];

  constructor(
    @Optional()
    private readonly configService?: ConfigService,
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    this.assertEnabledOutsideProduction();

    const providerPaymentId = `fake-payment-${randomUUID()}`;

    return {
      provider: this.name,
      providerPaymentId,
      paymentUrl: `https://fake-payment.example/pay/${providerPaymentId}?reference=${input.referenceId}`,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    this.assertEnabledOutsideProduction();

    return {
      providerPaymentId: input.providerPaymentId,
      transactionId: `fake-tx-${randomUUID()}`,
      amount: input.amount,
      currency: input.currency,
    };
  }

  /**
   * This provider simulates successful payments; it does not contact a real
   * payment gateway. Allow it only in explicitly identified development/test
   * environments so it cannot credit real balances in production.
   *
   * Default to disabled when the environment is missing or unrecognized.
   */
  private assertEnabledOutsideProduction(): void {
    const nodeEnv =
      this.configService?.get<string>("NODE_ENV") ?? process.env.NODE_ENV;

    if (nodeEnv !== "development" && nodeEnv !== "test") {
      throw new Error(
        "Fake payment provider is disabled. Use a real payment provider outside development/test.",
      );
    }
  }
}
