import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

/**
 * HTTP contract for OTP-based authentication.
 */
export class LoginOtpDto {
  @ApiProperty({
    example: "user@gmail.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "123456",
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  otp!: string;
}
