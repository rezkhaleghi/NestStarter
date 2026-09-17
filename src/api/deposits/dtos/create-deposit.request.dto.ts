import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumberString } from "class-validator";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

export class CreateDepositRequestDto {
  @ApiProperty({
    enum: PaymentProvider,
    example: PaymentProvider.FAKE_PROVIDER,
  })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

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
