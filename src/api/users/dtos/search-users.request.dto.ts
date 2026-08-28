import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class SearchUsersRequestDto {
  @ApiProperty({
    example: "pocketj",
    description:
      "Search by exact email, username, first name, last name, or full name.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  q: string;

  @ApiProperty({
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    example: 20,
    default: 20,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
