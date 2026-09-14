import { Module } from "@nestjs/common";

import { CreateUserUseCase } from "./use-cases/users/create-user.use-case";
import { VerifyOtpUseCase } from "./use-cases/auth/verify-otp.use-case";
import { GoogleAuthUseCase } from "./use-cases/auth/google-auth.use-case";
import { LoginWithPasswordUseCase } from "./use-cases/auth/login-with-password.use-case";
import { LoginWithOtpUseCase } from "./use-cases/auth/login-with-otp.use-case";
import { GetCurrentUserUseCase } from "./use-cases/users/get-current-user.use-case";
import { ChangeUserPasswordUseCase } from "./use-cases/users/change-user-password.use-case";
import { UpdateCurrentUserUseCase } from "./use-cases/users/update-current-user.use-case";
import { UpdateUserAvatarUseCase } from "./use-cases/users/update-user-avatar.use-case";
import { DeleteUserAvatarUseCase } from "./use-cases/users/delete-user-avatar.use-case";
import { SearchUsersUseCase } from "./use-cases/users/search-users.use-case";
import { GetUserBalancesUseCase } from "./use-cases/users/get-user-balances.use-case";

import { ListUsersUseCase } from "./use-cases/admin-users/list-users.use-case";
import { GetUserUseCase } from "./use-cases/admin-users/get-user.use-case";
import { CreateAdminUserUseCase } from "./use-cases/admin-users/create-user.use-case";
import { UpdateAdminUserUseCase } from "./use-cases/admin-users/update-user.use-case";
import { DeleteAdminUserUseCase } from "./use-cases/admin-users/delete-user.use-case";
import { DeleteAdminUserAvatarUseCase } from "./use-cases/admin-users/delete-user-avatar.use-case";
import { GetAdminStatisticsUseCase } from "./use-cases/admin-users/get-statistics.use-case";
import { GetAuditLogsUseCase } from "./use-cases/admin-users/get-audit-logs.use-case";

import { UpdateUserBalanceUseCase } from "./use-cases/admin-financials/update-user-balance.use-case";
import { ListLedgersUseCase } from "./use-cases/admin-financials/list-ledgers.use-case";
import { CreateDepositUseCase } from "./use-cases/deposits/create-deposit.use-case";
import { VerifyDepositUseCase } from "./use-cases/deposits/verify-deposit.use-case";
import { AdminListDepositsUseCase } from "./use-cases/admin-financials/list-deposits.use-case";
import { AdminGetDepositUseCase } from "./use-cases/admin-financials/get-deposit.use-case";
import { CreateWithdrawalUseCase } from "./use-cases/withdrawals/create-withdrawal.use-case";
import { AdminListWithdrawalsUseCase } from "./use-cases/admin-financials/list-withdrawals.use-case";
import { AdminGetWithdrawalUseCase } from "./use-cases/admin-financials/get-withdrawal.use-case";
import { AdminApproveWithdrawalUseCase } from "./use-cases/admin-financials/approve-withdrawal.use-case";
import { AdminRejectWithdrawalUseCase } from "./use-cases/admin-financials/reject-withdrawal.use-case";

import { ListDepositsUseCase } from "./use-cases/deposits/list-deposits.use-case";
import { GetDepositUseCase } from "./use-cases/deposits/get-deposit.use-case";
import { ListWithdrawalsUseCase } from "./use-cases/withdrawals/list-withdrawals.use-case";
import { GetWithdrawalUseCase } from "./use-cases/withdrawals/get-withdrawal.use-case";

import { CreateTicketUseCase } from "./use-cases/tickets/create-ticket.use-case";
import { ListUserTicketsUseCase } from "./use-cases/tickets/list-user-tickets.use-case";
import { GetTicketUseCase } from "./use-cases/tickets/get-ticket.use-case";
import { CreateTicketMessageUseCase } from "./use-cases/tickets/create-ticket-message.use-case";

import { ListAdminTicketsUseCase } from "./use-cases/admin-tickets/list-admin-tickets.use-case";
import { GetAdminTicketUseCase } from "./use-cases/admin-tickets/get-admin-ticket.use-case";
import { CreateAdminTicketMessageUseCase } from "./use-cases/admin-tickets/create-admin-ticket-message.use-case";
import { AssignTicketUseCase } from "./use-cases/admin-tickets/assign-ticket.use-case";
import { UpdateTicketStatusUseCase } from "./use-cases/admin-tickets/update-ticket-status.use-case";
import { UpdateTicketPriorityUseCase } from "./use-cases/admin-tickets/update-ticket-priority.use-case";
import { ListTicketCategoriesUseCase } from "./use-cases/admin-tickets/list-ticket-categories.use-case";
import { CreateTicketCategoryUseCase } from "./use-cases/admin-tickets/create-ticket-category.use-case";
import { UpdateTicketCategoryUseCase } from "./use-cases/admin-tickets/update-ticket-category.use-case";
import { DeleteTicketCategoryUseCase } from "./use-cases/admin-tickets/delete-ticket-category.use-case";

import { InfrastructureModule } from "../infrastructure/infrastructure.module";

/**
 * Registers application use cases. Infrastructure bindings are supplied by
 * the composition root and injected through application interfaces.
 */
@Module({
  imports: [InfrastructureModule],

  providers: [
    // Users
    CreateUserUseCase,
    GetCurrentUserUseCase,
    ChangeUserPasswordUseCase,
    UpdateCurrentUserUseCase,
    UpdateUserAvatarUseCase,
    DeleteUserAvatarUseCase,
    SearchUsersUseCase,
    GetUserBalancesUseCase,

    // Auth
    VerifyOtpUseCase,
    GoogleAuthUseCase,
    LoginWithPasswordUseCase,
    LoginWithOtpUseCase,

    // Deposits
    CreateDepositUseCase,
    VerifyDepositUseCase,
    ListDepositsUseCase,
    GetDepositUseCase,

    // Withdrawals
    CreateWithdrawalUseCase,
    ListWithdrawalsUseCase,
    GetWithdrawalUseCase,

    // tickets
    CreateTicketUseCase,
    ListUserTicketsUseCase,
    GetTicketUseCase,
    CreateTicketMessageUseCase,

    // Admin tickets
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

    // Admin users
    ListUsersUseCase,
    GetUserUseCase,
    CreateAdminUserUseCase,
    UpdateAdminUserUseCase,
    DeleteAdminUserUseCase,
    DeleteAdminUserAvatarUseCase,
    GetAdminStatisticsUseCase,
    GetAuditLogsUseCase,

    // Admin financials
    UpdateUserBalanceUseCase,
    ListLedgersUseCase,
    AdminListDepositsUseCase,
    AdminGetDepositUseCase,
    AdminListWithdrawalsUseCase,
    AdminGetWithdrawalUseCase,
    AdminApproveWithdrawalUseCase,
    AdminRejectWithdrawalUseCase,
  ],

  exports: [
    // Users
    CreateUserUseCase,
    GetCurrentUserUseCase,
    ChangeUserPasswordUseCase,
    UpdateCurrentUserUseCase,
    UpdateUserAvatarUseCase,
    DeleteUserAvatarUseCase,
    SearchUsersUseCase,
    GetUserBalancesUseCase,

    // Auth
    VerifyOtpUseCase,
    GoogleAuthUseCase,
    LoginWithPasswordUseCase,
    LoginWithOtpUseCase,

    // Admin users
    ListUsersUseCase,
    GetUserUseCase,
    CreateAdminUserUseCase,
    UpdateAdminUserUseCase,
    DeleteAdminUserUseCase,
    DeleteAdminUserAvatarUseCase,
    GetAdminStatisticsUseCase,
    GetAuditLogsUseCase,

    // Admin financials
    UpdateUserBalanceUseCase,
    ListLedgersUseCase,
    AdminListDepositsUseCase,
    AdminGetDepositUseCase,
    AdminListWithdrawalsUseCase,
    AdminGetWithdrawalUseCase,
    AdminApproveWithdrawalUseCase,
    AdminRejectWithdrawalUseCase,

    // Deposits
    CreateDepositUseCase,
    VerifyDepositUseCase,
    ListDepositsUseCase,
    GetDepositUseCase,

    // Withdrawals
    CreateWithdrawalUseCase,
    ListWithdrawalsUseCase,
    GetWithdrawalUseCase,

    // User tickets
    CreateTicketUseCase,
    ListUserTicketsUseCase,
    GetTicketUseCase,
    CreateTicketMessageUseCase,

    // Admin tickets
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
export class ApplicationModule {}
