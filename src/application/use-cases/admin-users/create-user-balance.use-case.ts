import { Injectable } from "@nestjs/common";

import { UserBalance } from "../../../domain/entities/user-balance.entity";
import { AuditLog } from "../../../domain/entities/audit-log.entity";

import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { AuditAction } from "../../../domain/enums/audit-action.enum";

import {
  UserBalanceAlreadyExistsException,
  UserNotFoundException,
} from "../../../domain/exceptions/domain.exception";

import { UnitOfWork } from "../../interfaces/unit-of-work.interface";

export interface CreateUserBalanceInput {
  userId: string;
  currency: PaymentCurrency;
  amount: string;
}

@Injectable()
export class CreateUserBalanceUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(
    input: CreateUserBalanceInput,
    actorUserId: string,
  ): Promise<UserBalance> {
    return this.unitOfWork.execute(
      async ({ userRepository, userBalanceRepository, auditLogRepository }) => {
        const user = await userRepository.findById(input.userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        const existingBalance =
          await userBalanceRepository.findByUserIdAndCurrency(
            input.userId,
            input.currency,
          );

        if (existingBalance) {
          throw new UserBalanceAlreadyExistsException(input.currency);
        }

        const balance = UserBalance.create({
          userId: input.userId,
          currency: input.currency,
          amount: input.amount,
        });

        const saved = await userBalanceRepository.create(balance);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId,
            targetUserId: input.userId,
            action: AuditAction.USER_BALANCE_CREATED,
            metadata: {
              currency: input.currency,
              amount: saved.amount,
            },
          }),
        );

        return saved;
      },
    );
  }
}
