import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserSearchResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  firstName: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ nullable: true })
  userName: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatar: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  dateOfBirth: Date | null;

  @ApiProperty()
  createdAt: Date;
}
