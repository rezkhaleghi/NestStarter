import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordRequestDto {
  @ApiProperty({ example: "newStrongPassword123", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
