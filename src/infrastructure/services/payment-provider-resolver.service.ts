import { Inject, Injectable } from "@nestjs/common";

import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { UnsupportedPaymentProviderException } from "@domain/exceptions/domain.exception";
import { PaymentProviderInterface } from "@application/interfaces/payment-provider.interface";
import {
  PaymentProviderResolver,
  PAYMENT_PROVIDERS,
} from "@application/interfaces/payment-provider-resolver.interface";

@Injectable()
export class PaymentProviderResolverService implements PaymentProviderResolver {
  private readonly providers = new Map<
    PaymentProvider,
    PaymentProviderInterface
  >();

  constructor(
    @Inject(PAYMENT_PROVIDERS)
    providers: PaymentProviderInterface[],
  ) {
    for (const provider of providers) {
      this.providers.set(provider.name, provider);
    }
  }

  resolve(provider: PaymentProvider): PaymentProviderInterface {
    const paymentProvider = this.providers.get(provider);

    if (!paymentProvider) {
      throw new UnsupportedPaymentProviderException(provider);
    }

    return paymentProvider;
  }
}
