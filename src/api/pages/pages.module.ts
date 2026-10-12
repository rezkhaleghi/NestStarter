import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";
import { PagesController } from "./pages.controller";

@Module({
  imports: [ApplicationModule],
  controllers: [PagesController],
})
export class PagesModule {}
