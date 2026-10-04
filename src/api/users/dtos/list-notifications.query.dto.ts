import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsEnum, IsOptional } from "class-validator";

import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListNotificationsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    enum: NotificationChannel,
    description: "Filter notifications by delivery channel.",
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({
    enum: NotificationType,
    description: "Filter notifications by notification type.",
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortDirection: "ASC" | "DESC" = "DESC";
}
