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
/**
 * Registers application use cases. Infrastructure bindings are supplied by
 * the composition root and injected through application interfaces.
 */
@Module({
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
  ],
})
export class ApplicationModule {}
