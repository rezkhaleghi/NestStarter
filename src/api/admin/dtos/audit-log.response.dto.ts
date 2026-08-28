import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AuditAction } from "../../../domain/enums/audit-action.enum";

export class AuditLogResponseDto {
  @ApiProperty({
    format: "uuid",
  })
  id: string;

  @ApiProperty({
    format: "uuid",
  })
  actorUserId: string;

  @ApiProperty({
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiPropertyOptional({
    format: "uuid",
    nullable: true,
  })
  targetUserId: string | null;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty()
  createdAt: Date;
}
