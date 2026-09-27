import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

/**
 * Common pagination parameters for HTTP GET collection endpoints.
 *
 * This class intentionally contains only transport-level validation.
 * Application use-cases continue to receive the framework-independent
 * PageQuery type from shared/pagination/page-query.ts.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: "Page number.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
    description: "Number of records per page.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

/**
 * Pagination variant for endpoints that support directional sorting.
 *
 * Feature-specific DTOs add their own strongly typed `sortBy` property.
 */
export class SortablePaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ["ASC", "DESC"],
    default: "DESC",
    description: "Sort direction.",
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortDirection: "ASC" | "DESC" = "DESC";
}
