import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { GetPublicPageUseCase } from "@application/use-cases/pages/get-page.use-case";

@ApiTags("pages")
@Controller("pages")
export class PagesController {
  constructor(private readonly getPageUseCase: GetPublicPageUseCase) {}

  @Get(":slug")
  @ApiOperation({ summary: "Get a published CMS page by slug" })
  @ApiParam({ name: "slug", example: "about-us" })
  @ApiResponse({ status: 200, description: "Published page content" })
  @ApiResponse({ status: 404, description: "Published page not found" })
  get(@Param("slug") slug: string) {
    return this.getPageUseCase.execute(slug);
  }
}
