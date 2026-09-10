import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from "class-validator";

import { TicketPriority } from "@domain/enums/ticket-priority.enum";
import { TicketStatus } from "@domain/enums/ticket-status.enum";

export class CreateAdminTicketMessageRequestDto {
  @ApiProperty({
    description: "Message body",
    example: "We are reviewing your request.",
  })
  @IsString()
  @Length(1, 5000)
  body!: string;
}

export class AssignTicketRequestDto {
  @ApiProperty({
    description: "Administrator user UUID, or null to unassign",
    format: "uuid",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId!: string | null;
}

export class UpdateTicketStatusRequestDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}

export class UpdateTicketPriorityRequestDto {
  @ApiProperty({ enum: TicketPriority })
  @IsEnum(TicketPriority)
  priority!: TicketPriority;
}

export class CreateTicketCategoryRequestDto {
  @ApiProperty({ example: "Account access" })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({ example: "Questions about account access and login" })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;
}

export class UpdateTicketCategoryRequestDto {
  @ApiPropertyOptional({ example: "Account access" })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    example: "Questions about account access",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
