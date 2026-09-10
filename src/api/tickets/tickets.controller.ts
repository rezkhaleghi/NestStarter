import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { AuthSessionGuard } from "../auth/auth-session.guard";
import { CreateTicketUseCase } from "@application/use-cases/tickets/create-ticket.use-case";
import { ListUserTicketsUseCase } from "@application/use-cases/tickets/list-user-tickets.use-case";
import { GetTicketUseCase } from "@application/use-cases/tickets/get-ticket.use-case";
import { CreateTicketMessageUseCase } from "@application/use-cases/tickets/create-ticket-message.use-case";
import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";

class CreateTicketRequestDto {
  subject: string;
  categoryId?: string;
  priority?: TicketPriority;
  message: string;
}

class CreateTicketMessageRequestDto {
  body: string;
}

class ListTicketsQueryDto {
  page?: number = 1;
  limit?: number = 20;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  sortBy?: "createdAt" | "priority" | "status" = "createdAt";
  sortDirection?: "ASC" | "DESC" = "DESC";
}

@ApiTags("tickets")
@Controller("tickets")
@UseGuards(AuthSessionGuard)
export class TicketsController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly listUserTicketsUseCase: ListUserTicketsUseCase,
    private readonly getTicketUseCase: GetTicketUseCase,
    private readonly createTicketMessageUseCase: CreateTicketMessageUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a ticket" })
  @ApiResponse({ status: 201, description: "Ticket created" })
  async create(@Body() dto: CreateTicketRequestDto, @Req() req: Request) {
    return this.createTicketUseCase.execute({
      userId: req.session.userId!,
      subject: dto.subject,
      categoryId: dto.categoryId,
      priority: dto.priority,
      message: dto.message,
    });
  }

  @Get()
  @ApiOperation({ summary: "List my tickets" })
  @ApiResponse({ status: 200, description: "Tickets list" })
  async list(@Query() query: ListTicketsQueryDto, @Req() req: Request) {
    return this.listUserTicketsUseCase.execute(req.session.userId!, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy ?? "createdAt",
      sortDirection: query.sortDirection ?? "DESC",
      status: query.status,
      priority: query.priority,
      categoryId: query.categoryId,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get my ticket detail" })
  @ApiResponse({ status: 200, description: "Ticket detail" })
  async get(@Param("id", ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.getTicketUseCase.execute({
      userId: req.session.userId!,
      ticketId: id,
    });
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Reply to a ticket" })
  @ApiResponse({ status: 201, description: "Message created" })
  async createMessage(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateTicketMessageRequestDto,
    @Req() req: Request,
  ) {
    return this.createTicketMessageUseCase.execute({
      userId: req.session.userId!,
      ticketId: id,
      body: dto.body,
    });
  }
}
