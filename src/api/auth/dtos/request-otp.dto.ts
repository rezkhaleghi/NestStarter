import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

/**
 * HTTP contract for requesting an OTP.
 */
export class RequestOtpDto {
  @ApiProperty({
    example: "user@gmail.com",
  })
  @IsEmail()
  email!: string;
}
