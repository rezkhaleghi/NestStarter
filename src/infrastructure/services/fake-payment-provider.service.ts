import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import {
  CreatePaymentInput,
  CreatePaymentResult,
  CreateWithdrawalInput,
  CreateWithdrawalResult,
  GetWithdrawalStatusInput,
  GetWithdrawalStatusResult,
  PaymentProviderInterface,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@application/interfaces/payment-provider.interface";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

@Injectable()
export class FakePaymentProvider implements PaymentProviderInterface {
  readonly name = PaymentProvider.NOWPAYMENTS;
  readonly supportedCurrencies = [PaymentCurrency.USD, PaymentCurrency.USDT];

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const providerPaymentId = `fake-payment-${randomUUID()}`;

    return {
      provider: this.name,
      providerPaymentId,
      paymentUrl: `https://fake-payment.example/pay/${providerPaymentId}?reference=${input.referenceId}`,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    return {
      providerPaymentId: input.providerPaymentId,
      transactionId: `fake-tx-${randomUUID()}`,
      amount: input.amount,
      currency: input.currency,
    };
  }

  async createWithdrawal(
    input: CreateWithdrawalInput,
  ): Promise<CreateWithdrawalResult> {
    return {
      provider: this.name,
      providerWithdrawalId: `fake-withdrawal-${randomUUID()}`,
      status: "PROCESSING",
      transactionId: `fake-withdrawal-tx-${randomUUID()}`,
    };
  }

  async getWithdrawalStatus(
    input: GetWithdrawalStatusInput,
  ): Promise<GetWithdrawalStatusResult> {
    return {
      providerWithdrawalId: input.providerWithdrawalId,
      status: "COMPLETED",
      transactionId: `fake-withdrawal-tx-${randomUUID()}`,
      amount: "0",
      currency: PaymentCurrency.USD,
    };
  }
}
