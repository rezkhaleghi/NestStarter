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
import { CreateWithdrawalUseCase } from "@application/use-cases/withdrawals/create-withdrawal.use-case";
import { ListWithdrawalsUseCase } from "@application/use-cases/withdrawals/list-withdrawals.use-case";
import { GetWithdrawalUseCase } from "@application/use-cases/withdrawals/get-withdrawal.use-case";

import { CreateWithdrawalRequestDto } from "./dtos/create-withdrawal.request.dto";
import { ListWithdrawalsQueryDto } from "./dtos/list-withdrawals.query.dto";

@ApiTags("withdrawals")
@Controller("withdrawals")
@UseGuards(AuthSessionGuard)
export class WithdrawalsController {
  constructor(
    private readonly createWithdrawalUseCase: CreateWithdrawalUseCase,
    private readonly listWithdrawalsUseCase: ListWithdrawalsUseCase,
    private readonly getWithdrawalUseCase: GetWithdrawalUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List my withdrawals" })
  @ApiResponse({ status: 200, description: "Withdrawal list" })
  async list(@Query() query: ListWithdrawalsQueryDto, @Req() req: Request) {
    return this.listWithdrawalsUseCase.execute({
      userId: req.session.userId!,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get my withdrawal" })
  @ApiResponse({ status: 200, description: "Withdrawal record" })
  async get(@Param("id", ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.getWithdrawalUseCase.execute({
      userId: req.session.userId!,
      id,
    });
  }

  @Post()
  @ApiOperation({ summary: "Request a withdrawal" })
  @ApiResponse({ status: 201, description: "Withdrawal created" })
  async create(@Body() dto: CreateWithdrawalRequestDto, @Req() req: Request) {
    return this.createWithdrawalUseCase.execute({
      userId: req.session.userId!,
      currency: dto.currency,
      amount: dto.amount,
      destination: dto.destination,
    });
  }
}
