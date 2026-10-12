import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

import { PageStatus } from "@domain/enums/page-status.enum";
import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListPagesQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({ enum: PageStatus })
  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @ApiPropertyOptional({
    enum: ["createdAt", "updatedAt", "title"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "title"])
  sortBy: "createdAt" | "updatedAt" | "title" = "createdAt";
}
