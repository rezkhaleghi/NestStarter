import { IsEnum, IsISO8601, IsOptional, IsUUID } from "class-validator";
import { AuditAction } from "../../../domain/enums/audit-action.enum";

export class GetAuditLogsQueryDto {
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  sortDirection?: "ASC" | "DESC";
}
