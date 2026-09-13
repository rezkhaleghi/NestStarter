import { Module } from "@nestjs/common";
import { ApplicationModule } from "../../application/application.module";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUserBalancesController } from "./admin-user-balances.controller";
import { AdminLedgersController } from "./admin-ledgers.controller";
import { AdminDepositsController } from "./admin-deposits.controller";
import { AdminWithdrawalsController } from "./admin-withdrawals.controller";
import { AdminTicketsController } from "./admin-tickets.controller";

@Module({
  imports: [ApplicationModule],

  controllers: [
    AdminUsersController,
    AdminUserBalancesController,
    AdminLedgersController,
    AdminDepositsController,
    AdminWithdrawalsController,
    AdminTicketsController,
  ],

  providers: [AdminAuthGuard],
})
export class AdminModule {}
