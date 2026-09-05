import { LedgerType } from "../enums/ledger-type.enum";
import { PaymentCurrency } from "../enums/payment-currency.enum";

export interface AdminLedgerSearchFilters {
  userId?: string;
  currency?: PaymentCurrency;
  type?: LedgerType;
  actorUserId?: string;
  referenceId?: string;
  from?: Date;
  to?: Date;
}
