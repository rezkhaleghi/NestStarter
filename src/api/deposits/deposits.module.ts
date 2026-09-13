import { Module } from "@nestjs/common";

import { ApplicationModule } from "../../application/application.module";
import { DepositsController } from "./deposits.controller";

@Module({
  imports: [ApplicationModule],
  controllers: [DepositsController],
})
export class DepositsModule {}
