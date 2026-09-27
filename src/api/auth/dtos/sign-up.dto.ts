import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, MinLength } from "class-validator";

/**
 * HTTP contract for user registration.
 *
 * The OTP is intentionally part of this DTO because the client submits it
 * together with the registration credentials. It is consumed by the
 * application layer and never persisted as part of the User entity.
 */
export class SignUpDto {
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

  @ApiProperty({
    example: "123456",
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  otp!: string;
}
