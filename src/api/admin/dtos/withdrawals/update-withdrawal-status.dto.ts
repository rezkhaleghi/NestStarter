import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";

export class UpdateWithdrawalStatusDto {
  @ApiProperty({
    enum: WithdrawalStatus,
    example: WithdrawalStatus.APPROVED,
  })
  @IsEnum(WithdrawalStatus)
  status!: WithdrawalStatus;

  @ApiPropertyOptional({
    description: "Reason for rejecting the withdrawal.",
    example: "Needs manual verification",
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: "Transaction ID/hash when the withdrawal is completed.",
    example: "0x123456789abcdef",
  })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
