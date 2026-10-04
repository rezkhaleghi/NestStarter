import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { NotificationChannel } from "@domain/enums/notification-channel.enum";
import { NotificationStatus } from "@domain/enums/notification-status.enum";
import { NotificationType } from "@domain/enums/notification-type.enum";

export class NotificationResponseDto {
  @ApiProperty({
    format: "uuid",
  })
  id!: string;

  @ApiProperty({
    format: "uuid",
  })
  userId!: string;

  @ApiProperty({
    enum: NotificationType,
  })
  type!: NotificationType;

  @ApiProperty({
    enum: NotificationChannel,
  })
  channel!: NotificationChannel;

  @ApiProperty({
    enum: NotificationStatus,
  })
  status!: NotificationStatus;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({
    format: "uuid",
    nullable: true,
  })
  referenceId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  sentAt!: Date | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  readAt!: Date | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  failureReason!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
