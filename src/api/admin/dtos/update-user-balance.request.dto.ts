import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString } from "class-validator";

export class UpdateUserBalanceRequestDto {
  @ApiProperty({
    example: "1500.50",
    description: "New balance amount.",
  })
  @IsNumberString()
  amount: string;
}
