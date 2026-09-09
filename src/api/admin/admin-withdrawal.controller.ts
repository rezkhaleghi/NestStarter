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
  ListWithdrawalsQueryDto,
  RejectWithdrawalRequestDto,
} from "./dtos/financial-query.dto";
import { AdminApproveWithdrawalUseCase } from "@application/use-cases/admin-financials/approve-withdrawal.use-case";
import { AdminGetWithdrawalUseCase } from "@application/use-cases/admin-financials/get-withdrawal.use-case";
import { AdminListWithdrawalsUseCase } from "@application/use-cases/admin-financials/list-withdrawals.use-case";
import { AdminRejectWithdrawalUseCase } from "@application/use-cases/admin-financials/reject-withdrawal.use-case";

@ApiTags("admin-withdrawals")
@Controller("admin/withdrawals")
@UseGuards(AdminAuthGuard)
export class AdminWithdrawalController {
  constructor(
    private readonly listWithdrawalsUseCase: AdminListWithdrawalsUseCase,
    private readonly getWithdrawalUseCase: AdminGetWithdrawalUseCase,
    private readonly approveWithdrawalUseCase: AdminApproveWithdrawalUseCase,
    private readonly rejectWithdrawalUseCase: AdminRejectWithdrawalUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List withdrawals" })
  @ApiResponse({ status: 200, description: "Withdrawals list" })
  async list(@Query() query: ListWithdrawalsQueryDto) {
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

  @Get(":id")
  @ApiOperation({ summary: "Get withdrawal detail" })
  @ApiResponse({ status: 200, description: "Withdrawal detail" })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.getWithdrawalUseCase.execute(id);
  }

  @Patch(":id/approve")
  @ApiOperation({ summary: "Approve withdrawal" })
  @ApiResponse({ status: 200, description: "Withdrawal approved" })
  async approve(@Param("id", ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.approveWithdrawalUseCase.execute({
      withdrawalId: id,
      adminUserId: req.session.userId!,
    });
  }

  @Patch(":id/reject")
  @ApiOperation({ summary: "Reject withdrawal" })
  @ApiResponse({ status: 200, description: "Withdrawal rejected" })
  async reject(
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
