import { Inject, Injectable } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { Ledger } from "@domain/entities/ledger.entity";

import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  DepositNotFoundException,
  NotMatchException,
  UserBalanceNotFoundException,
} from "@domain/exceptions/domain.exception";
import { addDecimal } from "@domain/utils/decimal.util";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import {
  PAYMENT_PROVIDER_RESOLVER,
  PaymentProviderResolver,
} from "@application/interfaces/payment-provider-resolver.interface";

export interface VerifyDepositInput {
  depositId: string;
  userId: string;
}

@Injectable()
export class VerifyDepositUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER_RESOLVER)
    private readonly paymentProviderResolver: PaymentProviderResolver,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: VerifyDepositInput): Promise<Deposit> {
    const deposit = await this.unitOfWork.execute(
      async ({ depositRepository }) => {
        const currentDeposit =
          await depositRepository.findByUserIdAndIdForUpdate(
            input.userId,
            input.depositId,
          );

        if (!currentDeposit) {
          throw new DepositNotFoundException();
        }

        if (currentDeposit.status === DepositStatus.COMPLETED) {
          return currentDeposit;
        }

        if (!currentDeposit.providerPaymentId) {
          throw new NotMatchException("Provider payment ID", "Deposit");
        }

        return currentDeposit;
      },
    );

    if (deposit.status === DepositStatus.COMPLETED) {
      return deposit;
    }

    if (!deposit.providerPaymentId) {
      throw new NotMatchException("Provider payment ID", "Deposit");
    }

    const paymentProvider = this.paymentProviderResolver.resolve(
      deposit.provider,
    );

    const verification = await paymentProvider.verifyPayment({
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

    return this.unitOfWork.execute(
      async ({
        depositRepository,
        userBalanceRepository,
        ledgerRepository,
        auditLogRepository,
      }) => {
        const currentDeposit =
          await depositRepository.findByUserIdAndIdForUpdate(
            input.userId,
            input.depositId,
          );

        if (!currentDeposit) {
          throw new DepositNotFoundException();
        }

        if (currentDeposit.status === DepositStatus.COMPLETED) {
          return currentDeposit;
        }

        if (!currentDeposit.providerPaymentId) {
          throw new NotMatchException("Provider payment ID", "Deposit");
        }

        if (
          currentDeposit.providerPaymentId !== verification.providerPaymentId
        ) {
          throw new NotMatchException("Provider payment ID", "Deposit");
        }

        const balance =
          await userBalanceRepository.findByUserIdAndCurrencyForUpdate(
            currentDeposit.userId,
            currentDeposit.currency,
          );

        if (!balance) {
          throw new UserBalanceNotFoundException(currentDeposit.currency);
        }

        const balanceBefore = balance.amount;
        const balanceAfter = addDecimal(balanceBefore, currentDeposit.amount);

        balance.amount = balanceAfter;

        const savedBalance = await userBalanceRepository.save(balance);

        await ledgerRepository.create(
          Ledger.create({
            userId: currentDeposit.userId,
            currency: currentDeposit.currency,
            amount: currentDeposit.amount,
            balanceBefore,
            balanceAfter: savedBalance.amount,
            type: LedgerType.DEPOSIT,
            referenceId: currentDeposit.referenceId,
            metadata: {
              depositId: currentDeposit.id,
              providerPaymentId: verification.providerPaymentId,
              transactionId: verification.transactionId,
            },
          }),
        );

        currentDeposit.markCompleted(verification.transactionId);

        await depositRepository.save(currentDeposit);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: currentDeposit.userId,
            targetUserId: currentDeposit.userId,
            action: AuditAction.DEPOSIT_COMPLETED,
            metadata: {
              depositId: currentDeposit.id,
              referenceId: currentDeposit.referenceId,
              amount: currentDeposit.amount,
              currency: currentDeposit.currency,
            },
          }),
        );

        return currentDeposit;
      },
    );
  }
}
