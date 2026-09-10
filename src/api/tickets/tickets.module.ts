import { Module } from "@nestjs/common";
import { ApplicationModule } from "@application/application.module";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { TicketsController } from "./tickets.controller";

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [TicketsController],
})
export class TicketsModule {}
