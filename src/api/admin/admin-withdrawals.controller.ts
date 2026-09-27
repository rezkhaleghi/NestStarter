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

import { AdminGetWithdrawalUseCase } from "@application/use-cases/admin-financials/get-withdrawal.use-case";
import { AdminListWithdrawalsUseCase } from "@application/use-cases/admin-financials/list-withdrawals.use-case";
import { AdminUpdateWithdrawalStatusUseCase } from "@application/use-cases/admin-financials/update-withdrawal-status.use-case";
import { ListWithdrawalsQueryDto } from "./dtos/withdrawals/list-withdrawals.query.dto";
import { UpdateWithdrawalStatusDto } from "./dtos/withdrawals/update-withdrawal-status.dto";

@ApiTags("admin-withdrawals")
@Controller("admin/withdrawals")
@UseGuards(AdminAuthGuard)
export class AdminWithdrawalsController {
  constructor(
    private readonly listWithdrawalsUseCase: AdminListWithdrawalsUseCase,
    private readonly getWithdrawalUseCase: AdminGetWithdrawalUseCase,
    private readonly updateWithdrawalStatusUseCase: AdminUpdateWithdrawalStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List withdrawals" })
  @ApiResponse({ status: 200, description: "Withdrawals list" })
  async list(@Query() query: ListWithdrawalsQueryDto) {
    return this.listWithdrawalsUseCase.execute({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      currency: query.currency,
      status: query.status,
      referenceId: query.referenceId,
      providerWithdrawalId: query.providerWithdrawalId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get withdrawal detail" })
  @ApiResponse({ status: 200, description: "Withdrawal detail" })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.getWithdrawalUseCase.execute(id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update withdrawal status" })
  @ApiResponse({
    status: 200,
    description: "Withdrawal status updated",
  })
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateWithdrawalStatusDto,
    @Req() req: Request,
  ) {
    return this.updateWithdrawalStatusUseCase.execute({
      withdrawalId: id,
      adminUserId: req.session.userId!,
      status: body.status,
      reason: body.reason,
      transactionId: body.transactionId,
    });
  }
}
