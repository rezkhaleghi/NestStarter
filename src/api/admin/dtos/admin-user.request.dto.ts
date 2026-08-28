import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  IsDateString,
  Length,
} from "class-validator";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { Transform, Type } from "class-transformer";
export class ListUsersQueryDto {
  @ApiPropertyOptional({
    description:
      "Search by email, username, first name, last name, or full name",
    example: "john",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: "Filter users by role",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Filter users by email verification status",
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
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
  })
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

  @ApiPropertyOptional({
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortDirection: "ASC" | "DESC" = "DESC";
}

export class CreateAdminUserRequestDto {
  @ApiProperty({
    example: "user@gmail.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "strongPassword123",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole = UserRole.USER;
}

export class UpdateAdminUserRequestDto {
  @ApiPropertyOptional({
    example: "updated@gmail.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: "newStrongPassword123",
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Whether the email address is verified",
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    example: "Jane",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string | null;

  @ApiPropertyOptional({
    example: "Doe",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string | null;

  @ApiPropertyOptional({
    example: "jane_doe",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  userName?: string | null;

  @ApiPropertyOptional({
    example: "1990-05-20",
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({
    example: "This is my bio.",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  bio?: string | null;
}
