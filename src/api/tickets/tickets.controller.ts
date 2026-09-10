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
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";

import { AuthSessionGuard } from "../auth/auth-session.guard";
import { ListTicketsQueryDto } from "./dtos/ticket-query.dto";
import {
  CreateTicketMessageRequestDto,
  CreateTicketRequestDto,
} from "./dtos/ticket.request.dto";
import { CreateTicketUseCase } from "@application/use-cases/tickets/create-ticket.use-case";
import { ListUserTicketsUseCase } from "@application/use-cases/tickets/list-user-tickets.use-case";
import { GetTicketUseCase } from "@application/use-cases/tickets/get-ticket.use-case";
import { CreateTicketMessageUseCase } from "@application/use-cases/tickets/create-ticket-message.use-case";

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
  @ApiBody({ type: CreateTicketRequestDto })
  @ApiResponse({ status: 201, description: "Ticket created" })
  @ApiResponse({ status: 400, description: "Invalid ticket data" })
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
  @ApiParam({ name: "id", description: "Ticket UUID", format: "uuid" })
  @ApiResponse({ status: 200, description: "Ticket detail" })
  @ApiResponse({ status: 400, description: "Invalid ticket UUID" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
  async get(@Param("id", ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.getTicketUseCase.execute({
      userId: req.session.userId!,
      ticketId: id,
    });
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Reply to a ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID", format: "uuid" })
  @ApiBody({ type: CreateTicketMessageRequestDto })
  @ApiResponse({ status: 201, description: "Message created" })
  @ApiResponse({ status: 400, description: "Invalid ticket UUID or message" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
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
