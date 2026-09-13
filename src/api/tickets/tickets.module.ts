import { Module } from "@nestjs/common";
import { ApplicationModule } from "@application/application.module";
import { TicketsController } from "./tickets.controller";

@Module({
  imports: [ApplicationModule],
  controllers: [TicketsController],
})
export class TicketsModule {}
