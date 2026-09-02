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
import { InfrastructureModule } from "../infrastructure/infrastructure.module";
import { GetUserBalancesUseCase } from "./use-cases/users/get-user-balances.use-case";
import { CreateUserBalanceUseCase } from "./use-cases/admin-users/create-user-balance.use-case";
import { UpdateUserBalanceUseCase } from "./use-cases/admin-users/update-user-balance.use-case";

/**
 * Registers application use cases. Infrastructure bindings are supplied by
 * the composition root and injected through application interfaces.
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateUserUseCase,
    VerifyOtpUseCase,
    GoogleAuthUseCase,
    LoginWithPasswordUseCase,
    LoginWithOtpUseCase,
    GetCurrentUserUseCase,
    ChangeUserPasswordUseCase,
    UpdateCurrentUserUseCase,
    UpdateUserAvatarUseCase,
    DeleteUserAvatarUseCase,
    SearchUsersUseCase,
    GetUserBalancesUseCase,
    CreateUserBalanceUseCase,
    UpdateUserBalanceUseCase,
  ],
  exports: [
    CreateUserUseCase,
    VerifyOtpUseCase,
    GoogleAuthUseCase,
    LoginWithPasswordUseCase,
    LoginWithOtpUseCase,
    GetCurrentUserUseCase,
    ChangeUserPasswordUseCase,
    UpdateCurrentUserUseCase,
    UpdateUserAvatarUseCase,
    DeleteUserAvatarUseCase,
    SearchUsersUseCase,
    GetUserBalancesUseCase,
    CreateUserBalanceUseCase,
    UpdateUserBalanceUseCase,
  ],
})
export class ApplicationModule {}
