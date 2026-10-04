import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsISO8601, IsOptional, IsUUID } from "class-validator";

import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationStatus } from "@domain/enums/notification-status.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListNotificationsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    format: "uuid",
    description: "Filter notifications by user.",
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: NotificationType,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    enum: NotificationChannel,
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({
    enum: NotificationStatus,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    example: "2026-09-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    example: "2026-09-30T23:59:59.999Z",
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
