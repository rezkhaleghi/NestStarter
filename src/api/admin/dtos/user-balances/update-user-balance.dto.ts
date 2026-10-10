import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString } from "class-validator";

export class UpdateUserBalanceDto {
  @ApiProperty({
    example: "1500.50",
    description: "Increase/Decrease user balance.",
  })
  @IsNumberString()
  amount!: string;
}
