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

import { CreateTicketUseCase } from "@application/use-cases/tickets/create-ticket.use-case";
import { ListUserTicketsUseCase } from "@application/use-cases/tickets/list-user-tickets.use-case";
import { GetTicketUseCase } from "@application/use-cases/tickets/get-ticket.use-case";
import { CreateTicketMessageUseCase } from "@application/use-cases/tickets/create-ticket-message.use-case";

import { CreateTicketDto } from "./dtos/create-ticket.dto";
import { ListTicketsQueryDto } from "./dtos/list-tickets.query.dto";
import { CreateTicketMessageDto } from "./dtos/create-ticket-message.dto";

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
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: 201, description: "Ticket created" })
  @ApiResponse({ status: 400, description: "Invalid ticket data" })
  async create(@Body() dto: CreateTicketDto, @Req() req: Request) {
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
    // Pagination defaults are owned by the DTO layer.
    // The global ValidationPipe transforms query strings and applies
    // the DTO property initializers before this controller receives them.
    return this.listUserTicketsUseCase.execute(req.session.userId!, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
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
  @ApiBody({ type: CreateTicketMessageDto })
  @ApiResponse({ status: 201, description: "Message created" })
  @ApiResponse({ status: 400, description: "Invalid ticket UUID or message" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
  async createMessage(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateTicketMessageDto,
    @Req() req: Request,
  ) {
    return this.createTicketMessageUseCase.execute({
      userId: req.session.userId!,
      ticketId: id,
      body: dto.body,
    });
  }
}
