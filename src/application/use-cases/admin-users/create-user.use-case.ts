import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { User } from "../../../domain/entities/user.entity";
import { UserBalance } from "../../../domain/entities/user-balance.entity";
import { AuditLog } from "../../../domain/entities/audit-log.entity";

import { UserRole } from "../../../domain/enums/user-role.enum";
import { PaymentCurrency } from "../../../domain/enums/payment-currency.enum";
import { AuditAction } from "../../../domain/enums/audit-action.enum";

import { UserAlreadyExistsException } from "../../../domain/exceptions/domain.exception";

import { PasswordHasher } from "../../interfaces/password-hasher.interface";
import { UnitOfWork } from "../../interfaces/unit-of-work.interface";
import { normalizeEmail } from "../../utils/normalize-email";

export interface CreateAdminUserInput {
  email: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    private readonly passwordHasher: PasswordHasher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    input: CreateAdminUserInput,
    actorUserId: string,
  ): Promise<User> {
    const email = normalizeEmail(input.email);

    const hashedPassword = await this.passwordHasher.hash(input.password);

    return this.unitOfWork.execute(
      async ({ userRepository, userBalanceRepository, auditLogRepository }) => {
        if (await userRepository.findByEmail(email)) {
          throw new UserAlreadyExistsException(email);
        }

        const user = User.create({
          id: randomUUID(),
          email,
          hashedPassword,
          role: input.role,
          emailVerified: true,
        });

        const balance = UserBalance.create({
          userId: user.id,
          currency: PaymentCurrency.USD,
          amount: "0",
        });

        const saved = await userRepository.save(user);

        await userBalanceRepository.create(balance);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId,
            targetUserId: saved.id,
            action: AuditAction.USER_CREATED,
            metadata: {
              email: saved.email,
              role: saved.role,
            },
          }),
        );

        return saved;
      },
    );
  }
}
