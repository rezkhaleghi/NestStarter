import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListUserBalancesQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    enum: ["currency", "amount", "createdAt"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["currency", "amount", "createdAt"])
  sortBy: "currency" | "amount" | "createdAt" = "createdAt";
}
