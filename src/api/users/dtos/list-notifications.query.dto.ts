import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsEnum, IsOptional } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListNotificationsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortDirection: "ASC" | "DESC" = "DESC";
}
