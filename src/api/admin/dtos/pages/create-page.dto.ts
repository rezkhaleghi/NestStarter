import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

import { PageStatus } from "@domain/enums/page-status.enum";

export class CreatePageDto {
  @ApiProperty({ example: "About Us", maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example: "about-us",
    maxLength: 160,
    description: "Lowercase letters and numbers, separated by single hyphens.",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiPropertyOptional({
    example: "<h1>About Us</h1><p>Welcome.</p>",
    maxLength: 200000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200000)
  content?: string;

  @ApiPropertyOptional({ enum: PageStatus, default: PageStatus.DRAFT })
  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;
}
