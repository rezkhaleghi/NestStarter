import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { AdminAuthGuard } from "./admin-auth.guard";
import {
  ListDepositsQueryDto,
  ListWithdrawalsQueryDto,
  RejectWithdrawalRequestDto,
} from "./dtos/financial-query.dto";
import { GetDepositUseCase } from "@application/use-cases/deposits/get-deposit.use-case";
import { ListDepositsUseCase } from "@application/use-cases/deposits/list-deposits.use-case";
import { ApproveWithdrawalUseCase } from "@application/use-cases/withdrawals/approve-withdrawal.use-case";
import { GetWithdrawalUseCase } from "@application/use-cases/withdrawals/get-withdrawal.use-case";
import { ListWithdrawalsUseCase } from "@application/use-cases/withdrawals/list-withdrawals.use-case";
import { RejectWithdrawalUseCase } from "@application/use-cases/withdrawals/reject-withdrawal.use-case";

@ApiTags("admin-financial")
@Controller("admin")
@UseGuards(AdminAuthGuard)
export class FinancialAdminController {
  constructor(
    private readonly listDepositsUseCase: ListDepositsUseCase,
    private readonly getDepositUseCase: GetDepositUseCase,
    private readonly listWithdrawalsUseCase: ListWithdrawalsUseCase,
    private readonly getWithdrawalUseCase: GetWithdrawalUseCase,
    private readonly approveWithdrawalUseCase: ApproveWithdrawalUseCase,
    private readonly rejectWithdrawalUseCase: RejectWithdrawalUseCase,
  ) {}

  @Get("deposits")
  @ApiOperation({ summary: "List deposits" })
  @ApiResponse({ status: 200, description: "Deposits list" })
  async listDeposits(@Query() query: ListDepositsQueryDto) {
    return this.listDepositsUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      userId: query.userId,
      currency: query.currency,
      status: query.status,
      referenceId: query.referenceId,
      providerPaymentId: query.providerPaymentId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  @Get("deposits/:id")
  @ApiOperation({ summary: "Get deposit detail" })
  @ApiResponse({ status: 200, description: "Deposit detail" })
  async getDeposit(@Param("id", ParseUUIDPipe) id: string) {
    return this.getDepositUseCase.execute(id);
  }

  @Get("withdrawals")
  @ApiOperation({ summary: "List withdrawals" })
  @ApiResponse({ status: 200, description: "Withdrawals list" })
  async listWithdrawals(@Query() query: ListWithdrawalsQueryDto) {
    return this.listWithdrawalsUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      userId: query.userId,
      currency: query.currency,
      status: query.status,
      referenceId: query.referenceId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  @Get("withdrawals/:id")
  @ApiOperation({ summary: "Get withdrawal detail" })
  @ApiResponse({ status: 200, description: "Withdrawal detail" })
  async getWithdrawal(@Param("id", ParseUUIDPipe) id: string) {
    return this.getWithdrawalUseCase.execute(id);
  }

  @Patch("withdrawals/:id/approve")
  @ApiOperation({ summary: "Approve withdrawal" })
  @ApiResponse({ status: 200, description: "Withdrawal approved" })
  async approveWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.approveWithdrawalUseCase.execute({
      withdrawalId: id,
      adminUserId: req.session.userId!,
    });
  }

  @Patch("withdrawals/:id/reject")
  @ApiOperation({ summary: "Reject withdrawal" })
  @ApiResponse({ status: 200, description: "Withdrawal rejected" })
  async rejectWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: RejectWithdrawalRequestDto,
    @Req() req: Request,
  ) {
    return this.rejectWithdrawalUseCase.execute({
      withdrawalId: id,
      adminUserId: req.session.userId!,
      reason: body.reason,
    });
  }
}
