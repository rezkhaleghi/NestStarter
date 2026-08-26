import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { UserRole } from "../../../domain/enums/user-role.enum";

export class ListUsersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    enum: ["createdAt", "email", "role"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "email", "role"])
  sortBy: "createdAt" | "email" | "role" = "createdAt";

  @ApiPropertyOptional({ enum: ["ASC", "DESC"], default: "DESC" })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortDirection: "ASC" | "DESC" = "DESC";
}

export class CreateAdminUserRequestDto {
  @ApiProperty({ example: "user@gmail.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "strongPassword123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole = UserRole.USER;
}

export class UpdateAdminUserRequestDto {
  @ApiPropertyOptional({ example: "updated@gmail.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "newStrongPassword123", minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: "Whether the email address is verified" })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}
