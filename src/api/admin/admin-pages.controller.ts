import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";

import { CreatePageUseCase } from "@application/use-cases/admin-pages/create-page.use-case";
import { DeletePageUseCase } from "@application/use-cases/admin-pages/delete-page.use-case";
import { GetPageUseCase } from "@application/use-cases/admin-pages/get-page.use-case";
import { ListPagesUseCase } from "@application/use-cases/admin-pages/list-pages.use-case";
import { UpdatePageUseCase } from "@application/use-cases/admin-pages/update-page.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";
import { CreatePageDto } from "./dtos/pages/create-page.dto";
import { ListPagesQueryDto } from "./dtos/pages/list-pages.query.dto";
import { UpdatePageDto } from "./dtos/pages/update-page.dto";

@ApiTags("admin-pages")
@Controller("admin/pages")
@UseGuards(AdminAuthGuard)
export class AdminPagesController {
  constructor(
    private readonly createPageUseCase: CreatePageUseCase,
    private readonly listPagesUseCase: ListPagesUseCase,
    private readonly getPageUseCase: GetPageUseCase,
    private readonly updatePageUseCase: UpdatePageUseCase,
    private readonly deletePageUseCase: DeletePageUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a CMS page" })
  @ApiBody({ type: CreatePageDto })
  @ApiResponse({ status: 201, description: "Page created" })
  @ApiResponse({ status: 400, description: "Invalid page input" })
  @ApiResponse({ status: 409, description: "Page slug already exists" })
  create(@Body() dto: CreatePageDto, @Req() req: Request) {
    return this.createPageUseCase.execute({
      actorUserId: req.session.userId!,
      title: dto.title,
      slug: dto.slug,
      content: dto.content,
      status: dto.status,
    });
  }

  @Get()
  @ApiOperation({ summary: "List CMS pages, including drafts" })
  @ApiResponse({ status: 200, description: "Paginated page list" })
  list(@Query() query: ListPagesQueryDto) {
    return this.listPagesUseCase.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      status: query.status,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a CMS page by ID, including drafts" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Page details" })
  @ApiResponse({ status: 404, description: "Page not found" })
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.getPageUseCase.execute(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a CMS page" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: UpdatePageDto })
  @ApiResponse({ status: 200, description: "Page updated" })
  @ApiResponse({ status: 404, description: "Page not found" })
  @ApiResponse({ status: 409, description: "Page slug already exists" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePageDto,
    @Req() req: Request,
  ) {
    return this.updatePageUseCase.execute({
      actorUserId: req.session.userId!,
      id,
      title: dto.title,
      slug: dto.slug,
      content: dto.content,
      status: dto.status,
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a CMS page" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Page deleted" })
  @ApiResponse({ status: 404, description: "Page not found" })
  async delete(@Param("id", ParseUUIDPipe) id: string, @Req() req: Request) {
    await this.deletePageUseCase.execute({
      actorUserId: req.session.userId!,
      id,
    });

    return { success: true };
  }
}
