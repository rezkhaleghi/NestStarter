import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

import { UserRole } from "@domain/enums/user-role.enum";
import { UserStatus } from "@domain/enums/user-status.enum";
import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListUsersQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    description:
      "Search by email, username, first name, last name, or full name.",
    example: "john",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: "Filter users by role.",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Filter users by email verification status.",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    enum: ["createdAt", "email", "role"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "email", "role"])
  sortBy: "createdAt" | "email" | "role" = "createdAt";

  @ApiPropertyOptional({
    enum: UserStatus,
    description: "Filter users by account status.",
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
