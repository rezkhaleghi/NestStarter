import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

export class UpdateTicketCategoryDto {
  @ApiPropertyOptional({ example: "Account access" })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    example: "Questions about account access",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
