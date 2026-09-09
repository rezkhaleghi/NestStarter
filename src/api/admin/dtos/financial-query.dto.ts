import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";

export class ListDepositsQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: PaymentCurrency })
  @IsOptional()
  @IsEnum(PaymentCurrency)
  currency?: PaymentCurrency;

  @ApiPropertyOptional({ enum: DepositStatus })
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  providerPaymentId?: string;

  @ApiPropertyOptional({ example: "2026-09-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: "2026-09-05T23:59:59.999Z" })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class ListWithdrawalsQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: PaymentCurrency })
  @IsOptional()
  @IsEnum(PaymentCurrency)
  currency?: PaymentCurrency;

  @ApiPropertyOptional({ enum: WithdrawalStatus })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ example: "2026-09-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: "2026-09-05T23:59:59.999Z" })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class RejectWithdrawalRequestDto {
  @ApiPropertyOptional({ example: "Needs manual verification" })
  @IsOptional()
  @IsString()
  reason?: string;
}
