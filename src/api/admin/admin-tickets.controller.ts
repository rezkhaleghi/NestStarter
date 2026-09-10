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
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { AdminAuthGuard } from "./admin-auth.guard";
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
import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";

class AdminListTicketsQueryDto {
  page?: number = 1;
  limit?: number = 20;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  userId?: string;
  assignedToUserId?: string;
  sortBy?: "createdAt" | "priority" | "status" = "createdAt";
  sortDirection?: "ASC" | "DESC" = "DESC";
}

class CreateAdminReplyRequestDto {
  body: string;
}

class AssignTicketRequestDto {
  assignedToUserId: string | null;
}

class UpdateTicketStatusRequestDto {
  status: TicketStatus;
}

class UpdateTicketPriorityRequestDto {
  priority: TicketPriority;
}

class CreateTicketCategoryRequestDto {
  name: string;
  description?: string;
}

class UpdateTicketCategoryRequestDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

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
  async listCategories(@Query() query: any) {
    return this.listTicketCategoriesUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy ?? "createdAt",
      sortDirection: query.sortDirection ?? "DESC",
    });
  }

  @Post("categories")
  @ApiOperation({ summary: "Create ticket category" })
  async createCategory(@Body() dto: CreateTicketCategoryRequestDto) {
    return this.createTicketCategoryUseCase.execute({
      name: dto.name,
      description: dto.description ?? null,
    });
  }

  @Patch("categories/:id")
  @ApiOperation({ summary: "Update ticket category" })
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
  async deactivateCategory(@Param("id", ParseUUIDPipe) id: string) {
    return this.deleteTicketCategoryUseCase.execute(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get admin ticket detail" })
  @ApiResponse({ status: 200, description: "Ticket detail" })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.getAdminTicketUseCase.execute(id);
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Reply as admin" })
  @ApiResponse({ status: 201, description: "Admin reply created" })
  async createMessage(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateAdminReplyRequestDto,
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
