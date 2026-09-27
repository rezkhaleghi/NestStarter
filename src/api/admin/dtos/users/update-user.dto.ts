import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from "class-validator";

import { UserRole } from "@domain/enums/user-role.enum";
import { UserStatus } from "@domain/enums/user-status.enum";

export class UpdateUserDto {
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
    description: "Whether the email address is verified.",
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

  @ApiPropertyOptional({
    enum: UserStatus,
    description: "Account status.",
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
