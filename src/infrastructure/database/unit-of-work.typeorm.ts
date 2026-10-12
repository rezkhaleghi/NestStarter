import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  UnitOfWork,
  UnitOfWorkRepositories,
} from "@application/interfaces/unit-of-work.interface";

import { UserRepositoryImpl } from "./repositories/user.repository.impl";
import { UserBalanceRepositoryImpl } from "./repositories/user-balance.repository.impl";
import { AuditLogRepositoryImpl } from "./repositories/audit-log.repository.impl";
import { LedgerRepositoryImpl } from "./repositories/ledger.repository.impl";
import { DepositRepositoryImpl } from "./repositories/deposit.repository.impl";
import { WithdrawalRepositoryImpl } from "./repositories/withdrawal.repository.impl";
import { TicketRepositoryImpl } from "./repositories/ticket.repository.impl";
import { TicketMessageRepositoryImpl } from "./repositories/ticket-message.repository.impl";
import { TicketCategoryRepositoryImpl } from "./repositories/ticket-category.repository.impl";
import { NotificationRepositoryImpl } from "./repositories/notification.repository.impl";
import { PageRepositoryImpl } from "./repositories/page.repository.impl";

import { UserOrmEntity } from "./orm-entities/user.orm-entity";
import { UserBalanceOrmEntity } from "./orm-entities/user-balance.orm-entity";
import { AuditLogOrmEntity } from "./orm-entities/audit-log.orm-entity";
import { LedgerOrmEntity } from "./orm-entities/ledger.orm-entity";
import { DepositOrmEntity } from "./orm-entities/deposit.orm-entity";
import { WithdrawalOrmEntity } from "./orm-entities/withdrawal.orm-entity";
import { TicketOrmEntity } from "./orm-entities/ticket.orm-entity";
import { TicketMessageOrmEntity } from "./orm-entities/ticket-message.orm-entity";
import { TicketCategoryOrmEntity } from "./orm-entities/ticket-category.orm-entity";
import { NotificationOrmEntity } from "./orm-entities/notification.orm-entity";
import { PageOrmEntity } from "./orm-entities/page.orm-entity";

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(
    work: (repositories: UnitOfWorkRepositories) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const repositories: UnitOfWorkRepositories = {
        userRepository: new UserRepositoryImpl(
          manager.getRepository(UserOrmEntity),
        ),
        userBalanceRepository: new UserBalanceRepositoryImpl(
          manager.getRepository(UserBalanceOrmEntity),
        ),
        auditLogRepository: new AuditLogRepositoryImpl(
          manager.getRepository(AuditLogOrmEntity),
        ),
        ledgerRepository: new LedgerRepositoryImpl(
          manager.getRepository(LedgerOrmEntity),
        ),
        depositRepository: new DepositRepositoryImpl(
          manager.getRepository(DepositOrmEntity),
        ),
        withdrawalRepository: new WithdrawalRepositoryImpl(
          manager.getRepository(WithdrawalOrmEntity),
        ),
        ticketRepository: new TicketRepositoryImpl(
          manager.getRepository(TicketOrmEntity),
        ),
        ticketMessageRepository: new TicketMessageRepositoryImpl(
          manager.getRepository(TicketMessageOrmEntity),
        ),
        ticketCategoryRepository: new TicketCategoryRepositoryImpl(
          manager.getRepository(TicketCategoryOrmEntity),
        ),
        notificationRepository: new NotificationRepositoryImpl(
          manager.getRepository(NotificationOrmEntity),
        ),
        pageRepository: new PageRepositoryImpl(
          manager.getRepository(PageOrmEntity),
        ),
      };

      return work(repositories);
    });
  }
}
