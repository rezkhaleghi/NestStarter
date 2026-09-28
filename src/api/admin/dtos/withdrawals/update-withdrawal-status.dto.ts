import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";

/**
 * Statuses that an administrator can actively assign.
 *
 * PENDING is intentionally excluded because it is the initial state created
 * when a withdrawal is submitted. Administrators can only move withdrawals
 * forward from that state.
 */
export const ADMIN_WITHDRAWAL_STATUSES = [
  WithdrawalStatus.APPROVED,
  WithdrawalStatus.REJECTED,
  WithdrawalStatus.COMPLETED,
] as const;

export type AdminWithdrawalStatus = (typeof ADMIN_WITHDRAWAL_STATUSES)[number];

export class UpdateWithdrawalStatusDto {
  @ApiProperty({
    enum: ADMIN_WITHDRAWAL_STATUSES,
    example: WithdrawalStatus.APPROVED,
  })
  @IsEnum(WithdrawalStatus)
  status!: AdminWithdrawalStatus;

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
