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
import { UpdateUserBalanceUseCase } from "@application/use-cases/admin-users/update-user-balance.use-case";

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [AdminUsersController, AdminUserBalancesController],
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
  ],
})
export class AdminModule {}
