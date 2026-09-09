import { UserRepository } from "../../domain/repositories/user.repository";
import { UserBalanceRepository } from "../../domain/repositories/user-balance.repository";
import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";
import { LedgerRepository } from "@domain/repositories/ledger.repository";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";

export interface UnitOfWorkRepositories {
  userRepository: UserRepository;
  userBalanceRepository: UserBalanceRepository;
  auditLogRepository: AuditLogRepository;
  ledgerRepository: LedgerRepository;
  depositRepository: DepositRepository;
  withdrawalRepository: WithdrawalRepository;
}

export abstract class UnitOfWork {
  abstract execute<T>(
    work: (repositories: UnitOfWorkRepositories) => Promise<T>,
  ): Promise<T>;
}
