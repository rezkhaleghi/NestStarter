import { Module } from "@nestjs/common";
import { InfrastructureModule } from "../infrastructure/infrastructure.module";
import { CreateUserUseCase } from "./use-cases/create-user.use-case";
import { VerifyOtpUseCase } from "./use-cases/verify-otp.use-case";
import { GoogleAuthUseCase } from "./use-cases/google-auth.use-case";
import { LoginUserUseCase } from "./use-cases/login-user.use-case";
import { GetCurrentUserUseCase } from "./use-cases/get-current-user.use-case";
import { ChangeUserPasswordUseCase } from "./use-cases/change-user-password.use-case";

/**
 * Wires use cases together. Imports InfrastructureModule so Nest's DI
 * container can resolve the abstract UserRepository/OtpService/PasswordHasher
 * tokens to their concrete infrastructure implementations.
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateUserUseCase,
    VerifyOtpUseCase,
    GoogleAuthUseCase,
    LoginUserUseCase,
    GetCurrentUserUseCase,
    ChangeUserPasswordUseCase,
  ],
  exports: [
    CreateUserUseCase,
    VerifyOtpUseCase,
    GoogleAuthUseCase,
    LoginUserUseCase,
    GetCurrentUserUseCase,
    ChangeUserPasswordUseCase,
  ],
})
export class ApplicationModule {}
