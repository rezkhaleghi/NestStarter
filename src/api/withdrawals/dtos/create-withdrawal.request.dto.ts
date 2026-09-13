import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumberString, IsString } from "class-validator";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

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
