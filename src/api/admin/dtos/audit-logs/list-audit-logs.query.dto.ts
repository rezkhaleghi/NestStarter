import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsISO8601, IsOptional, IsUUID } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";
import { AuditAction } from "@domain/enums/audit-action.enum";

export class ListAuditLogsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    enum: AuditAction,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @ApiPropertyOptional({
    example: "2026-09-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    example: "2026-09-05T23:59:59.999Z",
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
