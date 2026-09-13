import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumberString } from "class-validator";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

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
