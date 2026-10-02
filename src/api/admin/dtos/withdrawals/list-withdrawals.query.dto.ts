import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListWithdrawalsQueryDto extends SortablePaginationQueryDto {
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
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({
    description: "Provider withdrawal identifier.",
    example: "withdrawal_123456789",
  })
  @ApiPropertyOptional({ example: "2026-09-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: "2026-09-05T23:59:59.999Z" })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    enum: ["createdAt", "amount"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "amount"])
  sortBy: "createdAt" | "amount" = "createdAt";
}
