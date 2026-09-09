import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export class CreateDepositRequestDto {
  @ApiProperty({
    enum: PaymentCurrency,
    example: PaymentCurrency.USD,
  })
  @IsEnum(PaymentCurrency)
  currency!: PaymentCurrency;

  @ApiProperty({
    example: "100.00",
    description: "Positive deposit amount.",
  })
  @IsNumberString()
  amount!: string;
}

export class VerifyDepositRequestDto {
  @ApiProperty({
    example: "100.00",
  })
  @IsNumberString()
  amount!: string;

  @ApiProperty({
    enum: PaymentCurrency,
    example: PaymentCurrency.USD,
  })
  @IsEnum(PaymentCurrency)
  currency!: PaymentCurrency;
}

export class CreateWithdrawalRequestDto {
  @ApiProperty({
    enum: PaymentCurrency,
    example: PaymentCurrency.USD,
  })
  @IsEnum(PaymentCurrency)
  currency!: PaymentCurrency;

  @ApiProperty({
    example: "50.00",
  })
  @IsNumberString()
  amount!: string;

  @ApiProperty({
    example: "wallet:abc123",
  })
  @IsString()
  @IsNotEmpty()
  destination!: string;
}

export class ListUserFinancialQueryDto {
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

  @ApiPropertyOptional({ enum: ["createdAt", "amount"], default: "createdAt" })
  @IsOptional()
  @IsEnum(["createdAt", "amount"])
  sortBy: "createdAt" | "amount" = "createdAt";

  @ApiPropertyOptional({ enum: ["ASC", "DESC"], default: "DESC" })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortDirection: "ASC" | "DESC" = "DESC";
}
