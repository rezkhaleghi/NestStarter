import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

/**
 * HTTP contract for password-based authentication.
 */
export class LoginPasswordDto {
  @ApiProperty({
    example: "user@gmail.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "strongPassword123",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
