import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { SearchUsersUseCase } from "../../application/use-cases/users/search-users.use-case";
import { AuthSessionGuard } from "../auth/auth-session.guard";
import { SearchUsersRequestDto } from "./dtos/search-users.request.dto";
import { UserSearchResponseDto } from "./dtos/user-search.response.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly searchUsersUseCase: SearchUsersUseCase) {}

  @Get("search")
  @UseGuards(AuthSessionGuard)
  @ApiOperation({
    summary: "Search users",
    description:
      "Search users by exact email, username, first name, last name, or full name.",
  })
  @ApiResponse({
    status: 200,
    description: "Users matching the search query",
  })
  @ApiResponse({
    status: 401,
    description: "Not authenticated",
  })
  async search(@Query() query: SearchUsersRequestDto) {
    return this.searchUsersUseCase.execute(query.q, {
      page: query.page,
      limit: query.limit,
    });
  }
}
