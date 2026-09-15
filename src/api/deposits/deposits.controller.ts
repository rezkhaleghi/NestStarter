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
import { CreateDepositUseCase } from "@application/use-cases/deposits/create-deposit.use-case";
import { VerifyDepositUseCase } from "@application/use-cases/deposits/verify-deposit.use-case";
import { ListDepositsUseCase } from "@application/use-cases/deposits/list-deposits.use-case";
import { GetDepositUseCase } from "@application/use-cases/deposits/get-deposit.use-case";
import { CreateDepositRequestDto } from "./dtos/create-deposit.request.dto";
import { ListDepositsQueryDto } from "./dtos/list-deposits.query.dto";
@ApiTags("deposits")
@Controller("deposits")
@UseGuards(AuthSessionGuard)
export class DepositsController {
  constructor(
    private readonly createDepositUseCase: CreateDepositUseCase,
    private readonly verifyDepositUseCase: VerifyDepositUseCase,
    private readonly listDepositsUseCase: ListDepositsUseCase,
    private readonly getDepositUseCase: GetDepositUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List my deposits" })
  @ApiResponse({ status: 200, description: "Deposit list" })
  async list(@Req() req: Request, @Query() query: ListDepositsQueryDto) {
    return this.listDepositsUseCase.execute({
      userId: req.session.userId!,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get my deposit" })
  @ApiResponse({ status: 200, description: "Deposit record" })
  async get(@Param("id", ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.getDepositUseCase.execute({
      userId: req.session.userId!,
      id,
    });
  }

  @Post()
  @ApiOperation({ summary: "Create a deposit" })
  @ApiResponse({ status: 201, description: "Deposit created" })
  async create(@Body() dto: CreateDepositRequestDto, @Req() req: Request) {
    return this.createDepositUseCase.execute({
      userId: req.session.userId!,
      currency: dto.currency,
      amount: dto.amount,
    });
  }

  @Post(":id/verify")
  @ApiOperation({ summary: "Verify a deposit" })
  @ApiResponse({ status: 200, description: "Deposit verified" })
  async verify(@Param("id", ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.verifyDepositUseCase.execute({
      userId: req.session.userId!,
      depositId: id,
    });
  }
}
