import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class AssignTicketDto {
  @ApiProperty({
    description: "Administrator user UUID, or null to unassign.",
    format: "uuid",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId!: string | null;
}
