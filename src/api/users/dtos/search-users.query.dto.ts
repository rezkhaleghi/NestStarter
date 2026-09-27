import { ApiProperty } from "@nestjs/swagger";
import { PaginationQueryDto } from "@shared/pagination/pagination.query.dto";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class SearchUsersQueryDto extends PaginationQueryDto {
  @ApiProperty({
    example: "pocketj",
    description:
      "Search by exact email, username, first name, last name, or full name.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  q!: string;
}
