import { Module } from "@nestjs/common";
import { ApplicationModule } from "../../application/application.module";
import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminUsersController } from "./admin-users.controller";
import { CreateAdminUserUseCase } from "../../application/use-cases/admin-users/create-user.use-case";
import { DeleteAdminUserUseCase } from "../../application/use-cases/admin-users/delete-user.use-case";
import { GetUserUseCase } from "../../application/use-cases/admin-users/get-user.use-case";
import { ListUsersUseCase } from "../../application/use-cases/admin-users/list-users.use-case";
import { UpdateAdminUserUseCase } from "../../application/use-cases/admin-users/update-user.use-case";
import { DeleteAdminUserAvatarUseCase } from "@application/use-cases/admin-users/delete-user-avatar.use-case";
import { GetAdminStatisticsUseCase } from "../../application/use-cases/admin-users/get-statistics.use-case";
import { GetAuditLogsUseCase } from "@application/use-cases/admin-users/get-audit-logs.use-case";
import { AdminUserBalancesController } from "./admin-user-balances.controller";
import { UpdateUserBalanceUseCase } from "@application/use-cases/admin-financials/update-user-balance.use-case";
import { AdminLedgersController } from "./admin-ledgers.controller";
import { ListLedgersUseCase } from "@application/use-cases/admin-financials/list-ledgers.use-case";
import { AdminDepositController } from "./admin-deposit.controller";
import { AdminWithdrawalController } from "./admin-withdrawal.controller";
import { AdminTicketsController } from "./admin-tickets.controller";
import { ListAdminTicketsUseCase } from "@application/use-cases/admin-tickets/list-admin-tickets.use-case";
import { GetAdminTicketUseCase } from "@application/use-cases/admin-tickets/get-admin-ticket.use-case";
import { CreateAdminTicketMessageUseCase } from "@application/use-cases/admin-tickets/create-admin-ticket-message.use-case";
import { AssignTicketUseCase } from "@application/use-cases/admin-tickets/assign-ticket.use-case";
import { UpdateTicketStatusUseCase } from "@application/use-cases/admin-tickets/update-ticket-status.use-case";
import { UpdateTicketPriorityUseCase } from "@application/use-cases/admin-tickets/update-ticket-priority.use-case";
import { ListTicketCategoriesUseCase } from "@application/use-cases/admin-tickets/list-ticket-categories.use-case";
import { CreateTicketCategoryUseCase } from "@application/use-cases/admin-tickets/create-ticket-category.use-case";
import { UpdateTicketCategoryUseCase } from "@application/use-cases/admin-tickets/update-ticket-category.use-case";
import { DeleteTicketCategoryUseCase } from "@application/use-cases/admin-tickets/delete-ticket-category.use-case";

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [
    AdminUsersController,
    AdminUserBalancesController,
    AdminLedgersController,
    AdminDepositController,
    AdminWithdrawalController,
    AdminTicketsController,
  ],
  providers: [
    AdminAuthGuard,
    CreateAdminUserUseCase,
    DeleteAdminUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateAdminUserUseCase,
    DeleteAdminUserAvatarUseCase,
    GetAdminStatisticsUseCase,
    GetAuditLogsUseCase,
    UpdateUserBalanceUseCase,
    ListLedgersUseCase,
    ListAdminTicketsUseCase,
    GetAdminTicketUseCase,
    CreateAdminTicketMessageUseCase,
    AssignTicketUseCase,
    UpdateTicketStatusUseCase,
    UpdateTicketPriorityUseCase,
    ListTicketCategoriesUseCase,
    CreateTicketCategoryUseCase,
    UpdateTicketCategoryUseCase,
    DeleteTicketCategoryUseCase,
  ],
})
export class AdminModule {}
