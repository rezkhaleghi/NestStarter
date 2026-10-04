import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";

import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AdminAuthGuard } from "./admin-auth.guard";

import { AdminListNotificationsUseCase } from "@application/use-cases/admin-notifications/list-notifications.use-case";
import { AdminGetNotificationUseCase } from "@application/use-cases/admin-notifications/get-notification.use-case";

import { ListNotificationsQueryDto } from "./dtos/notifications/list-notifications.query.dto";

@ApiTags("admin-notifications")
@Controller("admin/notifications")
@UseGuards(AdminAuthGuard)
export class AdminNotificationsController {
  constructor(
    private readonly listNotificationsUseCase: AdminListNotificationsUseCase,
    private readonly getNotificationUseCase: AdminGetNotificationUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List notifications",
    description:
      "Returns a paginated list of notifications across all users with optional filters.",
  })
  @ApiResponse({
    status: 200,
    description: "Notifications list",
  })
  async list(@Query() query: ListNotificationsQueryDto) {
    return this.listNotificationsUseCase.execute({
      userId: query.userId,
      type: query.type,
      channel: query.channel,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      limit: query.limit,
      sortBy: "createdAt",
      sortDirection: query.sortDirection,
    });
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get notification details",
  })
  @ApiResponse({
    status: 200,
    description: "Notification details",
  })
  @ApiResponse({
    status: 404,
    description: "Notification not found",
  })
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.getNotificationUseCase.execute(id);
  }
}
