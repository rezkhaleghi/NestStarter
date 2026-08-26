import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { CreateAdminUserUseCase } from "../../application/use-cases/admin-users/create-user.use-case";
import { DeleteAdminUserUseCase } from "../../application/use-cases/admin-users/delete-user.use-case";
import { GetUserUseCase } from "../../application/use-cases/admin-users/get-user.use-case";
import { ListUsersUseCase } from "../../application/use-cases/admin-users/list-users.use-case";
import { UpdateAdminUserUseCase } from "../../application/use-cases/admin-users/update-user.use-case";
import { AdminAuthGuard } from "./admin-auth.guard";
import {
  CreateAdminUserRequestDto,
  ListUsersQueryDto,
  UpdateAdminUserRequestDto,
} from "./dtos/admin-user.request.dto";
import { ChangeUserPasswordRequestDto } from "./dtos/change-user-password.request.dto";
import { ChangeUserPasswordUseCase } from "../../application/use-cases/change-user-password.use-case";

@ApiTags("admin-users")
@Controller("admin/users")
@UseGuards(AdminAuthGuard)
export class AdminUsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly createUserUseCase: CreateAdminUserUseCase,
    private readonly updateUserUseCase: UpdateAdminUserUseCase,
    private readonly deleteUserUseCase: DeleteAdminUserUseCase,
    private readonly changeUserPasswordUseCase: ChangeUserPasswordUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all users" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: "Paginated user list" })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 403, description: "Administrator access required" })
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsersUseCase.execute(query);
    return {
      ...result,
      data: result.data.map((user) => this.toResponse(user)),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one user by ID" })
  @ApiParam({ name: "id", description: "User UUID", format: "uuid" })
  @ApiResponse({ status: 200, description: "User details" })
  @ApiResponse({ status: 404, description: "User not found" })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.toResponse(await this.getUserUseCase.execute(id));
  }

  @Post()
  @ApiOperation({ summary: "Create a user or administrator" })
  @ApiResponse({ status: 201, description: "User created" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  async create(@Body() dto: CreateAdminUserRequestDto) {
    return this.toResponse(await this.createUserUseCase.execute(dto));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user's email, password, or role" })
  @ApiParam({ name: "id", description: "User UUID", format: "uuid" })
  @ApiResponse({ status: 200, description: "User updated" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({
    status: 409,
    description: "Email conflict or last-admin rule",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserRequestDto,
  ) {
    return this.toResponse(
      await this.updateUserUseCase.execute({ id, ...dto }),
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a user" })
  @ApiParam({ name: "id", description: "User UUID", format: "uuid" })
  @ApiResponse({ status: 200, description: "User deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({
    status: 409,
    description: "Cannot delete the last administrator or yourself",
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    await this.deleteUserUseCase.execute(id, (request.session as any).userId);
    return { message: "User deleted." };
  }

  @Patch(":id/password")
  @ApiOperation({ summary: "Reset a user's password" })
  @ApiParam({ name: "id", description: "User UUID", format: "uuid" })
  @ApiResponse({ status: 200, description: "Password changed" })
  @ApiResponse({ status: 404, description: "User not found" })
  async changePassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserPasswordRequestDto,
  ) {
    await this.changeUserPasswordUseCase.execute({
      userId: id,
      password: dto.password,
    });
    return { message: "Password changed." };
  }

  private toResponse(user: {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
