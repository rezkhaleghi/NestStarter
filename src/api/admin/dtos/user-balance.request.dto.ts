import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export class GetUserBalancesQueryDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    enum: ["currency", "amount", "createdAt"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["currency", "amount", "createdAt"])
  sortBy: "currency" | "amount" | "createdAt" = "createdAt";

  @ApiPropertyOptional({
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortDirection: "ASC" | "DESC" = "DESC";
}

export class CreateUserBalanceRequestDto {
  @ApiProperty({
    enum: PaymentCurrency,
    example: PaymentCurrency.USDT,
  })
  @IsEnum(PaymentCurrency)
  currency: PaymentCurrency;

  @ApiProperty({
    example: "100.00000000",
    description: "Initial balance amount.",
  })
  @IsString()
  amount: string;
}
