import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateTicketMessageDto {
  @ApiProperty({
    description: "Message body.",
    example: "Thanks, I have attached the requested details.",
  })
  @IsString()
  @Length(1, 5000)
  body!: string;
}
