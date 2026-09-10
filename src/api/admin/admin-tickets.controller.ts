import {
  Body,
  Controller,
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

import { AdminAuthGuard } from "./admin-auth.guard";
import {
  AdminListCategoriesQueryDto,
  AdminListTicketsQueryDto,
} from "./dtos/admin-ticket-query.dto";
import {
  AssignTicketRequestDto,
  CreateAdminTicketMessageRequestDto,
  CreateTicketCategoryRequestDto,
  UpdateTicketCategoryRequestDto,
  UpdateTicketPriorityRequestDto,
  UpdateTicketStatusRequestDto,
} from "./dtos/admin-ticket.request.dto";
import { ListAdminTicketsUseCase } from "@application/use-cases/admin-tickets/list-admin-tickets.use-case";
import { GetAdminTicketUseCase } from "@application/use-cases/admin-tickets/get-admin-ticket.use-case";
import { CreateAdminTicketMessageUseCase } from "@application/use-cases/admin-tickets/create-admin-ticket-message.use-case";
import { AssignTicketUseCase } from "@application/use-cases/admin-tickets/assign-ticket.use-case";
import { UpdateTicketStatusUseCase } from "@application/use-cases/admin-tickets/update-ticket-status.use-case";
import { UpdateTicketPriorityUseCase } from "@application/use-cases/admin-tickets/update-ticket-priority.use-case";
import { ListTicketCategoriesUseCase } from "@application/use-cases/admin-tickets/list-ticket-categories.use-case";
import { CreateTicketCategoryUseCase } from "@application/use-cases/admin-tickets/create-ticket-category.use-case";
import { UpdateTicketCategoryUseCase } from "@application/use-cases/admin-tickets/update-ticket-category.use-case";
import { DeleteTicketCategoryUseCase } from "@application/use-cases/admin-tickets/delete-ticket-category.use-case";

@ApiTags("admin-tickets")
@Controller("admin/tickets")
@UseGuards(AdminAuthGuard)
export class AdminTicketsController {
  constructor(
    private readonly listAdminTicketsUseCase: ListAdminTicketsUseCase,
    private readonly getAdminTicketUseCase: GetAdminTicketUseCase,
    private readonly createAdminTicketMessageUseCase: CreateAdminTicketMessageUseCase,
    private readonly assignTicketUseCase: AssignTicketUseCase,
    private readonly updateTicketStatusUseCase: UpdateTicketStatusUseCase,
    private readonly updateTicketPriorityUseCase: UpdateTicketPriorityUseCase,
    private readonly listTicketCategoriesUseCase: ListTicketCategoriesUseCase,
    private readonly createTicketCategoryUseCase: CreateTicketCategoryUseCase,
    private readonly updateTicketCategoryUseCase: UpdateTicketCategoryUseCase,
    private readonly deleteTicketCategoryUseCase: DeleteTicketCategoryUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List tickets for admins" })
  @ApiResponse({ status: 200, description: "Tickets list" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Administrator access required" })
  async list(@Query() query: AdminListTicketsQueryDto) {
    return this.listAdminTicketsUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy ?? "createdAt",
      sortDirection: query.sortDirection ?? "DESC",
      status: query.status,
      priority: query.priority,
      categoryId: query.categoryId,
      userId: query.userId,
      assignedToUserId: query.assignedToUserId,
    });
  }

  @Get("categories")
  @ApiOperation({ summary: "List ticket categories" })
  @ApiResponse({ status: 200, description: "Ticket categories list" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Administrator access required" })
  async listCategories(@Query() query: AdminListCategoriesQueryDto) {
    return this.listTicketCategoriesUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy ?? "createdAt",
      sortDirection: query.sortDirection ?? "DESC",
    });
  }

  @Post("categories")
  @ApiOperation({ summary: "Create ticket category" })
  @ApiBody({ type: CreateTicketCategoryRequestDto })
  @ApiResponse({ status: 201, description: "Ticket category created" })
  @ApiResponse({ status: 409, description: "Ticket category already exists" })
  async createCategory(@Body() dto: CreateTicketCategoryRequestDto) {
    return this.createTicketCategoryUseCase.execute({
      name: dto.name,
      description: dto.description ?? null,
    });
  }

  @Patch("categories/:id")
  @ApiOperation({ summary: "Update ticket category" })
  @ApiParam({ name: "id", description: "Ticket category UUID", format: "uuid" })
  @ApiBody({ type: UpdateTicketCategoryRequestDto })
  @ApiResponse({ status: 200, description: "Ticket category updated" })
  @ApiResponse({ status: 404, description: "Ticket category not found" })
  async updateCategory(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketCategoryRequestDto,
  ) {
    return this.updateTicketCategoryUseCase.execute({
      id,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
    });
  }

  @Patch("categories/:id/deactivate")
  @ApiOperation({ summary: "Deactivate ticket category" })
  @ApiParam({ name: "id", description: "Ticket category UUID", format: "uuid" })
  @ApiResponse({ status: 200, description: "Ticket category deactivated" })
  @ApiResponse({ status: 404, description: "Ticket category not found" })
  async deactivateCategory(@Param("id", ParseUUIDPipe) id: string) {
    return this.deleteTicketCategoryUseCase.execute(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get admin ticket detail" })
  @ApiParam({ name: "id", description: "Ticket UUID", format: "uuid" })
  @ApiResponse({ status: 200, description: "Ticket detail" })
  @ApiResponse({ status: 400, description: "Invalid ticket UUID" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.getAdminTicketUseCase.execute(id);
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Reply as admin" })
  @ApiParam({ name: "id", description: "Ticket UUID", format: "uuid" })
  @ApiBody({ type: CreateAdminTicketMessageRequestDto })
  @ApiResponse({ status: 201, description: "Admin reply created" })
  @ApiResponse({ status: 400, description: "Invalid ticket UUID or message" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
  async createMessage(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateAdminTicketMessageRequestDto,
    @Req() req: Request,
  ) {
    return this.createAdminTicketMessageUseCase.execute({
      actorUserId: req.session.userId!,
      ticketId: id,
      body: dto.body,
    });
  }

  @Patch(":id/assign")
  @ApiOperation({ summary: "Assign a ticket to an admin" })
  @ApiParam({ name: "id", description: "Ticket UUID", format: "uuid" })
  @ApiBody({ type: AssignTicketRequestDto })
  @ApiResponse({ status: 200, description: "Ticket assignment updated" })
  @ApiResponse({
    status: 404,
    description: "Ticket or administrator not found",
  })
  async assign(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketRequestDto,
    @Req() req: Request,
  ) {
    await this.assignTicketUseCase.execute({
      actorUserId: req.session.userId!,
      ticketId: id,
      assignedToUserId: dto.assignedToUserId,
    });
    return { success: true };
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Change ticket status" })
  @ApiParam({ name: "id", description: "Ticket UUID", format: "uuid" })
  @ApiBody({ type: UpdateTicketStatusRequestDto })
  @ApiResponse({ status: 200, description: "Ticket status updated" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
  async status(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusRequestDto,
    @Req() req: Request,
  ) {
    await this.updateTicketStatusUseCase.execute({
      actorUserId: req.session.userId!,
      ticketId: id,
      status: dto.status,
    });
    return { success: true };
  }

  @Patch(":id/priority")
  @ApiOperation({ summary: "Change ticket priority" })
  @ApiParam({ name: "id", description: "Ticket UUID", format: "uuid" })
  @ApiBody({ type: UpdateTicketPriorityRequestDto })
  @ApiResponse({ status: 200, description: "Ticket priority updated" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
  async priority(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketPriorityRequestDto,
    @Req() req: Request,
  ) {
    await this.updateTicketPriorityUseCase.execute({
      actorUserId: req.session.userId!,
      ticketId: id,
      priority: dto.priority,
    });
    return { success: true };
  }
}
