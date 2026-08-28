import { Module } from "@nestjs/common";

import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { ApplicationModule } from "../../application/application.module";

import { UsersController } from "./users.controller";

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [UsersController],
})
export class UsersModule {}
