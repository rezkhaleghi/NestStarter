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
import {
  CreateDepositRequestDto,
  CreateWithdrawalRequestDto,
} from "./dtos/financial.request.dto";
import { CreateDepositUseCase } from "@application/use-cases/deposits/create-deposit.use-case";
import { VerifyDepositUseCase } from "@application/use-cases/deposits/verify-deposit.use-case";
import { ListDepositsUseCase } from "@application/use-cases/deposits/list-deposits.use-case";
import { GetDepositUseCase } from "@application/use-cases/deposits/get-deposit.use-case";
import { CreateWithdrawalUseCase } from "@application/use-cases/withdrawals/create-withdrawal.use-case";
import { ListWithdrawalsUseCase } from "@application/use-cases/withdrawals/list-withdrawals.use-case";
import { GetWithdrawalUseCase } from "@application/use-cases/withdrawals/get-withdrawal.use-case";

@ApiTags("financial")
@Controller()
@UseGuards(AuthSessionGuard)
export class FinancialController {
  constructor(
    private readonly createDepositUseCase: CreateDepositUseCase,
    private readonly verifyDepositUseCase: VerifyDepositUseCase,
    private readonly listDepositsUseCase: ListDepositsUseCase,
    private readonly getDepositUseCase: GetDepositUseCase,
    private readonly createWithdrawalUseCase: CreateWithdrawalUseCase,
    private readonly listWithdrawalsUseCase: ListWithdrawalsUseCase,
    private readonly getWithdrawalUseCase: GetWithdrawalUseCase,
  ) {}

  @Get("deposits")
  @ApiOperation({ summary: "List my deposits" })
  @ApiResponse({ status: 200, description: "Deposit list" })
  async listDeposits(@Req() req: Request, @Query() query: any) {
    return this.listDepositsUseCase.execute({
      userId: req.session.userId!,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy ?? "createdAt",
      sortDirection: query.sortDirection ?? "DESC",
    });
  }

  @Get("deposits/:id")
  @ApiOperation({ summary: "Get my deposit" })
  @ApiResponse({ status: 200, description: "Deposit record" })
  async getDeposit(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const deposit = await this.getDepositUseCase.execute(id);
    if (deposit.userId !== req.session.userId!) {
      throw new Error("Forbidden.");
    }
    return deposit;
  }

  @Post("deposits")
  @ApiOperation({ summary: "Create a deposit" })
  @ApiResponse({ status: 201, description: "Deposit created" })
  async createDeposit(
    @Body() dto: CreateDepositRequestDto,
    @Req() req: Request,
  ) {
    return this.createDepositUseCase.execute({
      userId: req.session.userId!,
      currency: dto.currency,
      amount: dto.amount,
    });
  }

  @Post("deposits/:id/verify")
  @ApiOperation({ summary: "Verify a deposit" })
  @ApiResponse({ status: 200, description: "Deposit verified" })
  async verifyDeposit(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const deposit = await this.getDepositUseCase.execute(id);
    if (deposit.userId !== req.session.userId!) {
      throw new Error("Forbidden.");
    }
    if (!deposit.providerPaymentId) {
      throw new Error("Deposit has no provider payment ID.");
    }

    return this.verifyDepositUseCase.execute({
      depositId: id,
      providerPaymentId: deposit.providerPaymentId,
      referenceId: deposit.referenceId,
      amount: deposit.amount,
      currency: deposit.currency,
    });
  }

  @Post("withdrawals")
  @ApiOperation({ summary: "Request a withdrawal" })
  @ApiResponse({ status: 201, description: "Withdrawal created" })
  async createWithdrawal(
    @Body() dto: CreateWithdrawalRequestDto,
    @Req() req: Request,
  ) {
    return this.createWithdrawalUseCase.execute({
      userId: req.session.userId!,
      currency: dto.currency,
      amount: dto.amount,
      destination: dto.destination,
    });
  }

  @Get("withdrawals")
  @ApiOperation({ summary: "List my withdrawals" })
  @ApiResponse({ status: 200, description: "Withdrawal list" })
  async listWithdrawals(@Query() query: any, @Req() req: Request) {
    return this.listWithdrawalsUseCase.execute({
      userId: req.session.userId!,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy ?? "createdAt",
      sortDirection: query.sortDirection ?? "DESC",
    });
  }

  @Get("withdrawals/:id")
  @ApiOperation({ summary: "Get my withdrawal" })
  @ApiResponse({ status: 200, description: "Withdrawal record" })
  async getWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const withdrawal = await this.getWithdrawalUseCase.execute(id);
    if (withdrawal.userId !== req.session.userId!) {
      throw new Error("Forbidden.");
    }
    return withdrawal;
  }
}
