import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { PaymentProviderInterface } from "./payment-provider.interface";

export interface PaymentProviderResolver {
  resolve(provider: PaymentProvider): PaymentProviderInterface;
}

export const PAYMENT_PROVIDER_RESOLVER = Symbol("PAYMENT_PROVIDER_RESOLVER");

export const PAYMENT_PROVIDERS = Symbol("PAYMENT_PROVIDERS");
