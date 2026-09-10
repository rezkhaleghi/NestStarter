import { Injectable, Inject } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { UserBalanceNotFoundException } from "@domain/exceptions/domain.exception";
import { addDecimal } from "@domain/utils/decimal.util";
import {
  PAYMENT_PROVIDER,
  PaymentProviderInterface,
} from "@application/interfaces/payment-provider.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { Ledger } from "@domain/entities/ledger.entity";

export interface VerifyDepositInput {
  depositId: string;
  providerPaymentId: string;
  referenceId: string;
  amount: string;
  currency: PaymentCurrency;
}

@Injectable()
export class VerifyDepositUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProviderInterface,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: VerifyDepositInput): Promise<Deposit> {
    return this.unitOfWork.execute(
      async ({
        depositRepository,
        userBalanceRepository,
        ledgerRepository,
        auditLogRepository,
      }) => {
        const deposit = await depositRepository.findByIdForUpdate(
          input.depositId,
        );

        if (!deposit) {
          throw new Error("Deposit not found.");
        }

        if (deposit.status === DepositStatus.COMPLETED) {
          return deposit;
        }

        if (deposit.providerPaymentId !== input.providerPaymentId) {
          throw new Error("Provider payment ID does not match the deposit.");
        }

        if (deposit.referenceId !== input.referenceId) {
          throw new Error("Reference ID does not match the deposit.");
        }

        const verification = await this.paymentProvider.verifyPayment({
          providerPaymentId: input.providerPaymentId,
          referenceId: input.referenceId,
          amount: input.amount,
          currency: input.currency,
        });

        if (
          verification.amount !== deposit.amount ||
          verification.currency !== deposit.currency
        ) {
          throw new Error("Verified deposit amount or currency mismatch.");
        }

        const balance =
          await userBalanceRepository.findByUserIdAndCurrencyForUpdate(
            deposit.userId,
            deposit.currency,
          );

        if (!balance) {
          throw new UserBalanceNotFoundException(deposit.currency);
        }

        // Preserve the original balance before mutating the entity.
        const balanceBefore = balance.amount;

        const balanceAfter = addDecimal(balanceBefore, deposit.amount);

        balance.amount = balanceAfter;

        const savedBalance = await userBalanceRepository.save(balance);

        await ledgerRepository.create(
          Ledger.create({
            userId: deposit.userId,
            currency: deposit.currency,
            amount: deposit.amount,
            balanceBefore,
            balanceAfter: savedBalance.amount,
            type: LedgerType.DEPOSIT,
            referenceId: deposit.referenceId,
            metadata: {
              depositId: deposit.id,
              providerPaymentId: input.providerPaymentId,
              transactionId: verification.transactionId,
            },
          }),
        );

        deposit.markCompleted(verification.transactionId);

        await depositRepository.save(deposit);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: deposit.userId,
            targetUserId: deposit.userId,
            action: AuditAction.USER_BALANCE_UPDATED,
            metadata: {
              type: "DEPOSIT_COMPLETED",
              depositId: deposit.id,
              referenceId: deposit.referenceId,
              amount: deposit.amount,
              currency: deposit.currency,
            },
          }),
        );

        return deposit;
      },
    );
  }
}
