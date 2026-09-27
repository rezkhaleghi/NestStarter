import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

import { TicketStatus } from "@domain/enums/ticket-status.enum";

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}
