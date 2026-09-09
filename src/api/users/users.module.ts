import { Module } from "@nestjs/common";

import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { ApplicationModule } from "../../application/application.module";

import { UsersController } from "./users.controller";
import { FinancialController } from "./financial.controller";

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [UsersController, FinancialController],
})
export class UsersModule {}
