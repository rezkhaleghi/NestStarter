import { Module } from "@nestjs/common";

import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { ApplicationModule } from "../../application/application.module";

import { UsersController } from "./users.controller";
import { DepositsController } from "./deposits.controller";
import { WithdrawalsController } from "./withdrawals.controller";

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [UsersController, DepositsController, WithdrawalsController],
})
export class UsersModule {}
