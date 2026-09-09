import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AdminAuthGuard } from "./admin-auth.guard";
import { ListDepositsQueryDto } from "./dtos/financial-query.dto";
import { AdminGetDepositUseCase } from "@application/use-cases/admin-financials/get-deposit.use-case";
import { AdminListDepositsUseCase } from "@application/use-cases/admin-financials/list-deposits.use-case";

@ApiTags("admin-deposits")
@Controller("admin/deposits")
@UseGuards(AdminAuthGuard)
export class AdminDepositController {
  constructor(
    private readonly listDepositsUseCase: AdminListDepositsUseCase,
    private readonly getDepositUseCase: AdminGetDepositUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List deposits" })
  @ApiResponse({ status: 200, description: "Deposits list" })
  async list(@Query() query: ListDepositsQueryDto) {
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

  @Get(":id")
  @ApiOperation({ summary: "Get deposit detail" })
  @ApiResponse({ status: 200, description: "Deposit detail" })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.getDepositUseCase.execute(id);
  }
}
