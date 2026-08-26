import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { ApplicationModule } from "../../application/application.module";
import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { AuthController } from "./auth.controller";

@Module({
  imports: [
    ApplicationModule,
    InfrastructureModule,
    PassportModule.register({ session: true }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
