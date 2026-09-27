import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export class ListLedgersQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    description: "Filter ledgers by user ID.",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: PaymentCurrency,
    description: "Filter by currency.",
  })
  @IsOptional()
  @IsEnum(PaymentCurrency)
  currency?: PaymentCurrency;

  @ApiPropertyOptional({
    enum: LedgerType,
    description: "Filter by ledger type.",
  })
  @IsOptional()
  @IsEnum(LedgerType)
  type?: LedgerType;

  @ApiPropertyOptional({
    description: "Filter by the admin/user who performed the operation.",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({
    description: "Filter by reference ID.",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({
    description: "Return ledgers created from this date.",
    example: "2026-09-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: "Return ledgers created until this date.",
    example: "2026-09-05T23:59:59.999Z",
  })
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
