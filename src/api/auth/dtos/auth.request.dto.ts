import { IsEmail, IsString, Length, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * API-layer DTO — matches exactly what the client sends over HTTP.
 * Includes `otp` because that's part of the request payload,
 * even though it never reaches the database layer.
 */
export class SignUpRequestDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "strongPassword123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: "123456", minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  otp!: string;
}

export class RequestOtpDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;
}

export class LoginEmailRequestDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "strongPassword123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginOtpRequestDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "123456", minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  otp!: string;
}
