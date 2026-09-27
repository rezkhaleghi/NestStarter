import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListTicketsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: "Ticket category UUID.",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: "Ticket owner's user UUID.",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: "Assigned administrator's user UUID.",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({
    enum: ["createdAt", "priority", "status"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "priority", "status"])
  sortBy: "createdAt" | "priority" | "status" = "createdAt";
}
