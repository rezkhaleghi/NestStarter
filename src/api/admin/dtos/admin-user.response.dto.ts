import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../../domain/enums/user-role.enum";

export class AdminUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty({ nullable: true, type: String, format: "date" })
  dateOfBirth!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
