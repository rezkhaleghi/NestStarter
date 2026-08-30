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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { CreateAdminUserUseCase } from "../../application/use-cases/admin-users/create-user.use-case";
import { DeleteAdminUserUseCase } from "../../application/use-cases/admin-users/delete-user.use-case";
import { GetUserUseCase } from "../../application/use-cases/admin-users/get-user.use-case";
import { ListUsersUseCase } from "../../application/use-cases/admin-users/list-users.use-case";
import { UpdateAdminUserUseCase } from "../../application/use-cases/admin-users/update-user.use-case";
import { GetAuditLogsUseCase } from "../../application/use-cases/admin-users/get-audit-logs.use-case";
import { DeleteAdminUserAvatarUseCase } from "../../application/use-cases/admin-users/delete-user-avatar.use-case";
import { GetAdminStatisticsUseCase } from "../../application/use-cases/admin-users/get-statistics.use-case";

import { ChangeUserPasswordUseCase } from "../../application/use-cases/users/change-user-password.use-case";

import { AdminAuthGuard } from "./admin-auth.guard";

import { GetAuditLogsQueryDto } from "./dtos/get-audit-logs-query.dto";
import {
  CreateAdminUserRequestDto,
  ListUsersQueryDto,
  UpdateAdminUserRequestDto,
} from "./dtos/admin-user.request.dto";
import { ChangeUserPasswordRequestDto } from "./dtos/change-user-password.request.dto";
import { AdminUserResponseDto } from "./dtos/admin-user.response.dto";
import { AdminUserListResponseDto } from "./dtos/admin-user-list.response.dto";

import { UserStatus } from "@domain/enums/user-status.enum";

/**
 * HTTP controller for administrator user management.
 *
 * Responsibilities:
 * - Receive and validate HTTP requests through DTOs.
 * - Extract route/query/body/session data.
 * - Delegate business operations to application use cases.
 * - Convert domain users into API response DTOs.
 *
 * The controller does not contain domain business rules.
 * Domain behavior is handled by User and application use cases.
 */
@Controller("admin/users")
@ApiTags("admin-users")
@UseGuards(AdminAuthGuard)
export class AdminUsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly createUserUseCase: CreateAdminUserUseCase,
    private readonly updateUserUseCase: UpdateAdminUserUseCase,
    private readonly deleteUserUseCase: DeleteAdminUserUseCase,
    private readonly changeUserPasswordUseCase: ChangeUserPasswordUseCase,
    private readonly deleteAdminUserAvatarUseCase: DeleteAdminUserAvatarUseCase,
    private readonly getAdminStatisticsUseCase: GetAdminStatisticsUseCase,
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase,
  ) {}

  /**
   * Returns statistics for the administrator dashboard.
   */
  @Get("statistics")
  @ApiOperation({
    summary: "Get admin dashboard statistics",
  })
  @ApiResponse({
    status: 200,
    description: "Admin statistics",
  })
  async statistics() {
    return this.getAdminStatisticsUseCase.execute();
  }

  /**
   * Returns paginated audit logs with optional filters.
   */
  @Get("audit-logs")
  @ApiOperation({
    summary: "Get admin audit logs",
    description:
      "List audit logs with optional filtering by action, actor, target user, and date range.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated audit log list",
  })
  async auditLogs(@Query() query: GetAuditLogsQueryDto) {
    const result = await this.getAuditLogsUseCase.execute(
      {
        action: query.action,
        actorUserId: query.actorUserId,
        targetUserId: query.targetUserId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      },
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        sortBy: "createdAt",
        sortDirection: query.sortDirection ?? "DESC",
      },
    );

    return {
      ...result,
      data: result.data,
    };
  }

  /**
   * Lists and searches users with pagination, sorting, and filtering.
   */
  @Get()
  @ApiOperation({
    summary: "List and search users",
    description:
      "List users with pagination, sorting, filtering, and prefix search by email, username, first name, last name, or full name.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated user list",
    type: AdminUserListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Authentication required",
  })
  @ApiResponse({
    status: 403,
    description: "Administrator access required",
  })
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsersUseCase.execute(query);

    return {
      ...result,
      data: result.data.map((user) => this.toResponse(user)),
    };
  }

  /**
   * Returns one user by UUID.
   */
  @Get(":id")
  @ApiOperation({
    summary: "Get one user by ID",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "User details",
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.toResponse(await this.getUserUseCase.execute(id));
  }

  /**
   * Creates a new regular user or administrator account.
   *
   * The current administrator is passed to the use case so the
   * creation can be recorded in the audit log.
   */
  @Post()
  @ApiOperation({
    summary: "Create a user or administrator",
  })
  @ApiResponse({
    status: 201,
    description: "User created",
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "Email already exists",
  })
  async create(
    @Body() dto: CreateAdminUserRequestDto,
    @Req() request: Request,
  ) {
    return this.toResponse(
      await this.createUserUseCase.execute(dto, request.session.userId!),
    );
  }

  /**
   * Updates a user's account and profile.
   *
   * The DTO contains only fields provided by the administrator.
   * The application use case decides which domain operations
   * are required for those changes.
   */
  @Patch(":id")
  @ApiOperation({
    summary: "Update a user's account and profile",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "User updated",
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  @ApiResponse({
    status: 409,
    description: "Email, username, or last-admin conflict",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserRequestDto,
    @Req() request: Request,
  ) {
    return this.toResponse(
      await this.updateUserUseCase.execute(
        {
          id,
          ...dto,

          // Convert the API date string into the domain Date type.
          // Undefined means "do not change"; null means "clear the value".
          dateOfBirth:
            dto.dateOfBirth === undefined || dto.dateOfBirth === null
              ? dto.dateOfBirth
              : new Date(dto.dateOfBirth),
        },
        request.session.userId!,
      ),
    );
  }

  /**
   * Deletes a user account.
   *
   * The current administrator's ID is passed to the use case
   * so the deletion can be audited.
   */
  @Delete(":id")
  @ApiOperation({
    summary: "Delete a user",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "User deleted",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  @ApiResponse({
    status: 409,
    description: "Cannot delete the last administrator or yourself",
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    await this.deleteUserUseCase.execute(id, request.session.userId!);

    return {
      message: "User deleted.",
    };
  }

  /**
   * Allows an administrator to reset another user's password.
   */
  @Patch(":id/password")
  @ApiOperation({
    summary: "Reset a user's password",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Password changed",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async changePassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserPasswordRequestDto,
  ) {
    await this.changeUserPasswordUseCase.execute({
      userId: id,
      password: dto.password,
    });

    return {
      message: "Password changed.",
    };
  }

  /**
   * Deletes another user's avatar.
   *
   * The current administrator's ID is passed to the use case
   * so the avatar deletion can be recorded in the audit log.
   */
  @Delete(":id/avatar")
  @ApiOperation({
    summary: "Delete a user's avatar",
  })
  @ApiParam({
    name: "id",
    description: "User UUID",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Avatar deleted",
    type: AdminUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async deleteAvatar(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = await this.deleteAdminUserAvatarUseCase.execute(
      id,
      request.session.userId!,
    );

    return this.toResponse(user);
  }

  /**
   * Maps the domain User entity to the API response shape.
   *
   * Keeping this mapping here prevents internal domain properties
   * from being exposed directly through the HTTP API.
   */
  private toResponse(user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
    dateOfBirth: Date | null;
    avatar: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
    status: UserStatus;
  }): AdminUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as AdminUserResponseDto["role"],
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      status: user.status,
    };
  }
}
