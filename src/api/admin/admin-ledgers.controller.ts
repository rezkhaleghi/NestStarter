import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ListLedgersUseCase } from "../../application/use-cases/admin-ledgers/list-ledgers.use-case";
import { ListLedgersQueryDto } from "./dtos/list-ledgers-query.dto";

@ApiTags("admin - Ledgers")
@Controller("admin/ledgers")
export class AdminLedgersController {
  constructor(private readonly listLedgersUseCase: ListLedgersUseCase) {}

  @Get()
  @ApiOperation({
    summary: "List user ledgers",
    description:
      "Returns a paginated list of immutable ledger records with optional filters.",
  })
  @ApiResponse({
    status: 200,
    description: "Ledger list retrieved successfully.",
  })
  async list(@Query() query: ListLedgersQueryDto) {
    return this.listLedgersUseCase.execute({
      userId: query.userId,
      currency: query.currency,
      type: query.type,
      actorUserId: query.actorUserId,
      referenceId: query.referenceId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
  }
}
