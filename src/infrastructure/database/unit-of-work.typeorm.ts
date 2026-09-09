import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  UnitOfWork,
  UnitOfWorkRepositories,
} from "../../application/interfaces/unit-of-work.interface";

import { UserRepositoryImpl } from "./repositories/user.repository.impl";
import { UserBalanceRepositoryImpl } from "./repositories/user-balance.repository.impl";
import { AuditLogRepositoryImpl } from "./repositories/audit-log.repository.impl";
import { LedgerRepositoryImpl } from "./repositories/ledger.repository.impl";

import { UserOrmEntity } from "./orm-entities/user.orm-entity";
import { UserBalanceOrmEntity } from "./orm-entities/user-balance.orm-entity";
import { AuditLogOrmEntity } from "./orm-entities/audit-log.orm-entity";
import { LedgerOrmEntity } from "./orm-entities/ledger.orm-entity";
import { DepositOrmEntity } from "./orm-entities/deposit.orm-entity";
import { WithdrawalOrmEntity } from "./orm-entities/withdrawal.orm-entity";
import { DepositRepositoryImpl } from "./repositories/deposit.repository.impl";
import { WithdrawalRepositoryImpl } from "./repositories/withdrawal.repository.impl";

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(
    work: (repositories: UnitOfWorkRepositories) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = new UserRepositoryImpl(
        manager.getRepository(UserOrmEntity),
      );

      const userBalanceRepository = new UserBalanceRepositoryImpl(
        manager.getRepository(UserBalanceOrmEntity),
      );

      const auditLogRepository = new AuditLogRepositoryImpl(
        manager.getRepository(AuditLogOrmEntity),
      );

      const ledgerRepository = new LedgerRepositoryImpl(
        manager.getRepository(LedgerOrmEntity),
      );

      const depositRepository = new DepositRepositoryImpl(
        manager.getRepository(DepositOrmEntity),
      );

      const withdrawalRepository = new WithdrawalRepositoryImpl(
        manager.getRepository(WithdrawalOrmEntity),
      );

      return work({
        userRepository,
        userBalanceRepository,
        auditLogRepository,
        ledgerRepository,
        depositRepository,
        withdrawalRepository,
      });
    });
  }
}
