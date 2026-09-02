import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

import { CreateUserBalanceUseCase } from "../../application/use-cases/admin-users/create-user-balance.use-case";
import { UpdateUserBalanceUseCase } from "../../application/use-cases/admin-users/update-user-balance.use-case";
import { GetUserBalancesUseCase } from "../../application/use-cases/users/get-user-balances.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";

import { CreateUserBalanceRequestDto } from "../users/dtos/user-balance.request.dto";
import { GetUserBalancesQueryDto } from "../users/dtos/user-balance.request.dto";
import { UpdateUserBalanceRequestDto } from "./dtos/update-user-balance.request.dto";

@Controller("admin/users/:userId/balances")
@ApiTags("admin-user-balances")
@UseGuards(AdminAuthGuard)
export class AdminUserBalancesController {
  constructor(
    private readonly getUserBalancesUseCase: GetUserBalancesUseCase,
    private readonly createUserBalanceUseCase: CreateUserBalanceUseCase,
    private readonly updateUserBalanceUseCase: UpdateUserBalanceUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get user balances",
    description:
      "Returns a paginated list of balances belonging to the specified user.",
  })
  @ApiParam({
    name: "userId",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated user balances",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async getBalances(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Query() query: GetUserBalancesQueryDto,
  ) {
    return this.getUserBalancesUseCase.execute(userId, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Post()
  @ApiOperation({
    summary: "Create a user balance",
    description:
      "Creates a balance for a currency that does not already exist for the user.",
  })
  @ApiParam({
    name: "userId",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 201,
    description: "Balance created",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  @ApiResponse({
    status: 409,
    description: "Balance already exists for this currency",
  })
  async createBalance(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() dto: CreateUserBalanceRequestDto,
    @Req() request: Request,
  ) {
    return this.createUserBalanceUseCase.execute(
      {
        userId,
        currency: dto.currency,
        amount: dto.amount,
      },
      request.session.userId!,
    );
  }

  @Patch(":currency")
  @ApiOperation({
    summary: "Update a user's balance",
  })
  @ApiParam({
    name: "userId",
    description: "User UUID",
    format: "uuid",
  })
  @ApiParam({
    name: "currency",
    enum: PaymentCurrency,
  })
  @ApiResponse({
    status: 200,
    description: "Balance updated",
  })
  @ApiResponse({
    status: 404,
    description: "User or balance not found",
  })
  async updateBalance(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Param("currency", new ParseEnumPipe(PaymentCurrency))
    currency: PaymentCurrency,
    @Body() dto: UpdateUserBalanceRequestDto,
    @Req() request: Request,
  ) {
    return this.updateUserBalanceUseCase.execute(
      {
        userId,
        currency,
        amount: dto.amount,
      },
      request.session.userId!,
    );
  }
}
