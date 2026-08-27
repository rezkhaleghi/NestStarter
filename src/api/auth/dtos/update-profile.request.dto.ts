import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, Length } from "class-validator";

export class UpdateProfileRequestDto {
  @ApiPropertyOptional({ example: "Jane", nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string | null;

  @ApiPropertyOptional({ example: "Doe", nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string | null;

  @ApiPropertyOptional({ example: "jane_doe", nullable: true })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  userName?: string | null;

  @ApiPropertyOptional({ example: "1990-05-20", nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({
    example: "https://example.com/avatar.jpg",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiPropertyOptional({ example: "This is my bio.", nullable: true })
  @IsOptional()
  @IsString()
  bio?: string | null;
}
