import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";
import { WithdrawalsController } from "./withdrawals.controller";

@Module({
  imports: [ApplicationModule],
  controllers: [WithdrawalsController],
})
export class WithdrawalsModule {}
