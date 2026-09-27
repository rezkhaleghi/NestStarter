import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateTicketMessageDto {
  @ApiProperty({
    description: "Message body.",
    example: "We are reviewing your request.",
  })
  @IsString()
  @Length(1, 5000)
  body!: string;
}
