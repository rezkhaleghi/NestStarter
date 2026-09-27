import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID, Length } from "class-validator";

import { TicketPriority } from "@domain/enums/ticket-priority.enum";

export class CreateTicketDto {
  @ApiProperty({
    description: "Short subject of the ticket.",
    example: "Unable to withdraw funds",
  })
  @IsString()
  @Length(1, 255)
  subject!: string;

  @ApiPropertyOptional({
    description: "Ticket category UUID.",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: TicketPriority,
    default: TicketPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({
    description: "Initial message.",
    example: "My withdrawal has been pending since yesterday.",
  })
  @IsString()
  @Length(1, 5000)
  message!: string;
}
