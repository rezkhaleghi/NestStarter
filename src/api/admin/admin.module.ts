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

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [AdminUsersController],
  providers: [
    AdminAuthGuard,
    CreateAdminUserUseCase,
    DeleteAdminUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateAdminUserUseCase,
    DeleteAdminUserAvatarUseCase,
    GetAdminStatisticsUseCase,
  ],
})
export class AdminModule {}
