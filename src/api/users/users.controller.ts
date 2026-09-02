import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Post,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import type { Request } from "express";

import { User } from "../../domain/entities/user.entity";

import { AuthSessionGuard } from "../auth/auth-session.guard";

import { GetCurrentUserUseCase } from "../../application/use-cases/users/get-current-user.use-case";

import { UpdateCurrentUserUseCase } from "../../application/use-cases/users/update-current-user.use-case";

import { UpdateUserAvatarUseCase } from "../../application/use-cases/users/update-user-avatar.use-case";

import { DeleteUserAvatarUseCase } from "../../application/use-cases/users/delete-user-avatar.use-case";

import { SearchUsersUseCase } from "../../application/use-cases/users/search-users.use-case";

import { UpdateProfileRequestDto } from "../auth/dtos/update-profile.request.dto";

import { SearchUsersRequestDto } from "./dtos/search-users.request.dto";

import { UserSearchResponseDto } from "./dtos/user-search.response.dto";

import { AuthenticatedUserResponseDto } from "../auth/dtos/authenticated-user.response.dto";

import { GetUserBalancesUseCase } from "@application/use-cases/users/get-user-balances.use-case";
import { GetUserBalancesQueryDto } from "@api/users/dtos/user-balance.request.dto";

@ApiTags("users")
@Controller("users")
@UseGuards(AuthSessionGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getCurrentUserBalancesUseCase: GetUserBalancesUseCase,
    private readonly updateCurrentUserUseCase: UpdateCurrentUserUseCase,
    private readonly updateUserAvatarUseCase: UpdateUserAvatarUseCase,
    private readonly deleteUserAvatarUseCase: DeleteUserAvatarUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
  ) {}

  @Get("me")
  @ApiOperation({
    summary: "Get the currently authenticated user's profile",
  })
  @ApiResponse({
    status: 200,
    description: "Current user profile",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Not authenticated",
  })
  async getMe(@Req() req: Request) {
    const user = await this.getCurrentUserUseCase.execute(req.session.userId!);

    return this.toUserResponse(user);
  }

  @Get("me/balances")
  @ApiOperation({
    summary: "Get the currently authenticated user's balances",
    description:
      "Returns a paginated list of balances belonging to the currently authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: "Current user's balances",
  })
  @ApiResponse({
    status: 401,
    description: "Not authenticated",
  })
  async getMyBalances(
    @Query() query: GetUserBalancesQueryDto,
    @Req() req: Request,
  ) {
    return this.getCurrentUserBalancesUseCase.execute(req.session.userId!, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }

  @Patch("me")
  @ApiOperation({
    summary: "Update the currently authenticated user's profile",
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "Username already exists",
  })
  async updateMe(@Body() dto: UpdateProfileRequestDto, @Req() req: Request) {
    const user = await this.updateCurrentUserUseCase.execute(
      req.session.userId!,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        userName: dto.userName,
        dateOfBirth:
          dto.dateOfBirth === undefined || dto.dateOfBirth === null
            ? dto.dateOfBirth
            : new Date(dto.dateOfBirth),
        bio: dto.bio,
      },
    );

    return this.toUserResponse(user);
  }

  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({
    summary: "Update the currently authenticated user's avatar",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
      required: ["file"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Avatar updated",
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid or unsupported image",
  })
  async updateAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp|gif)$/,
          }),
        ],
      }),
    )
    file: {
      buffer: Buffer;
      mimetype: string;
    },
    @Req() req: Request,
  ) {
    const user = await this.updateUserAvatarUseCase.execute(
      req.session.userId!,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
      },
    );

    return this.toUserResponse(user);
  }

  @Delete("me/avatar")
  @ApiOperation({
    summary: "Delete the currently authenticated user's avatar",
  })
  @ApiResponse({
    status: 200,
    description: "Avatar deleted",
    type: AuthenticatedUserResponseDto,
  })
  async deleteAvatar(@Req() req: Request) {
    const user = await this.deleteUserAvatarUseCase.execute(
      req.session.userId!,
    );

    return this.toUserResponse(user);
  }

  @Get("search")
  @ApiOperation({
    summary: "Search users",
    description:
      "Search users by exact email, username, first name, last name, or full name.",
  })
  @ApiResponse({
    status: 200,
    description: "Users matching the search query",
  })
  async search(@Query() query: SearchUsersRequestDto) {
    return this.searchUsersUseCase.execute(query.q, {
      page: query.page,
      limit: query.limit,
    });
  }

  private toUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      bio: user.bio,
    };
  }
}
