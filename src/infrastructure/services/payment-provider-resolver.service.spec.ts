import { PaymentProviderResolverService } from "./payment-provider-resolver.service";

import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { UnsupportedPaymentProviderException } from "@domain/exceptions/domain.exception";
import { PaymentProviderInterface } from "@application/interfaces/payment-provider.interface";

describe("PaymentProviderResolverService", () => {
  const fakeProvider: PaymentProviderInterface = {
    name: PaymentProvider.FAKE_PROVIDER,
    supportedCurrencies: [PaymentCurrency.USD],
    createPayment: jest.fn(),
    verifyPayment: jest.fn(),
  };

  it("should resolve a registered payment provider", () => {
    const resolver = new PaymentProviderResolverService([fakeProvider]);

    const result = resolver.resolve(PaymentProvider.FAKE_PROVIDER);

    expect(result).toBe(fakeProvider);
  });

  it("should throw when the payment provider is not registered", () => {
    const resolver = new PaymentProviderResolverService([]);

    expect(() => resolver.resolve(PaymentProvider.FAKE_PROVIDER)).toThrow(
      UnsupportedPaymentProviderException,
    );
  });

  it("should resolve the correct provider when multiple providers are registered", () => {
    const secondProvider = {
      ...fakeProvider,
      name: "second-provider" as PaymentProvider,
    };

    const resolver = new PaymentProviderResolverService([
      fakeProvider,
      secondProvider,
    ]);

    expect(resolver.resolve(PaymentProvider.FAKE_PROVIDER)).toBe(fakeProvider);
    expect(resolver.resolve("second-provider" as PaymentProvider)).toBe(
      secondProvider,
    );
  });
});
