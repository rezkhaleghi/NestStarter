import { Injectable } from "@nestjs/common";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

@Injectable()
export class ListTicketCategoriesUseCase {
  constructor(
    private readonly ticketCategoryRepository: TicketCategoryRepository,
  ) {}

  async execute(
    input: PageQuery<"createdAt" | "name">,
  ): Promise<PageResult<TicketCategory>> {
    return this.ticketCategoryRepository.findPage({
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    });
  }
}
