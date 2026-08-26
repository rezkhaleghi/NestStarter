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
import { ApiTags } from "@nestjs/swagger";
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
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsersUseCase.execute(query);
    return {
      ...result,
      data: result.data.map((user) => this.toResponse(user)),
    };
  }

  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.toResponse(await this.getUserUseCase.execute(id));
  }

  @Post()
  async create(@Body() dto: CreateAdminUserRequestDto) {
    return this.toResponse(await this.createUserUseCase.execute(dto));
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserRequestDto,
  ) {
    return this.toResponse(
      await this.updateUserUseCase.execute({ id, ...dto }),
    );
  }

  @Delete(":id")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    await this.deleteUserUseCase.execute(id, (request.session as any).userId);
    return { message: "User deleted." };
  }

  @Patch(":id/password")
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
