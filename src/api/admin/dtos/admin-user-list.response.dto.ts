import { ApiProperty } from "@nestjs/swagger";
import { AdminUserResponseDto } from "./admin-user.response.dto";

export class AdminUserListResponseDto {
  @ApiProperty({
    type: [AdminUserResponseDto],
  })
  data!: AdminUserResponseDto[];

  @ApiProperty({
    example: 1,
  })
  page!: number;

  @ApiProperty({
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    example: 1250,
  })
  total!: number;

  @ApiProperty({
    example: 63,
  })
  totalPages!: number;
}
