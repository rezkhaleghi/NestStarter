import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [TerminusModule, InfrastructureModule],
  controllers: [HealthController],
})
export class HealthModule {}
