import { Injectable, Inject } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { Ledger } from "@domain/entities/ledger.entity";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  DepositNotFoundException,
  NotMatchException,
  UserBalanceNotFoundException,
} from "@domain/exceptions/domain.exception";
import { addDecimal } from "@domain/utils/decimal.util";

import {
  PAYMENT_PROVIDER,
  PaymentProviderInterface,
} from "@application/interfaces/payment-provider.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface VerifyDepositInput {
  depositId: string;
  userId: string;
  // providerPaymentId: string;
  // referenceId: string;
  // amount: string;
  // currency: PaymentCurrency;
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
        const deposit = await depositRepository.findByUserIdAndId(
          input.userId,
          input.depositId,
        );

        if (!deposit) {
          throw new DepositNotFoundException();
        }

        if (deposit.status === DepositStatus.COMPLETED) {
          return deposit;
        }

        if (!deposit.providerPaymentId) {
          throw new NotMatchException("Provider payment ID", "Deposit");
        }

        // if (deposit.providerPaymentId !== input.providerPaymentId) {
        //   throw new NotMatchException("Provider payment ID", "Deposit");
        // }

        // if (deposit.referenceId !== input.referenceId) {
        //   throw new NotMatchException("Reference ID", "Deposit");
        // }

        const verification = await this.paymentProvider.verifyPayment({
          providerPaymentId: deposit.providerPaymentId,
          referenceId: deposit.referenceId,
          amount: deposit.amount,
          currency: deposit.currency,
        });

        if (
          verification.providerPaymentId !== deposit.providerPaymentId ||
          verification.amount !== deposit.amount ||
          verification.currency !== deposit.currency
        ) {
          throw new NotMatchException("Verified payment", "Deposit");
        }

        const balance =
          await userBalanceRepository.findByUserIdAndCurrencyForUpdate(
            deposit.userId,
            deposit.currency,
          );

        if (!balance) {
          throw new UserBalanceNotFoundException(deposit.currency);
        }

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
              providerPaymentId: verification.providerPaymentId,
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
            action: AuditAction.DEPOSIT_COMPLETED,
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
