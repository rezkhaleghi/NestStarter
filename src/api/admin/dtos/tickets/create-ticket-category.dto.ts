import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

export class CreateTicketCategoryDto {
  @ApiProperty({ example: "Account access" })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({
    example: "Questions about account access and login",
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;
}
