import { Injectable } from "@nestjs/common";

import { Page } from "@domain/entities/page.entity";
import { PageStatus } from "@domain/enums/page-status.enum";
import { PageRepository } from "@domain/repositories/page.repository";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

export interface ListPagesInput extends PageQuery<
  "createdAt" | "updatedAt" | "title"
> {
  status?: PageStatus;
}

@Injectable()
export class ListPagesUseCase {
  constructor(private readonly pageRepository: PageRepository) {}

  execute(input: ListPagesInput): Promise<PageResult<Page>> {
    const { page, limit, sortBy, sortDirection, status } = input;

    return this.pageRepository.findPage(
      { status },
      { page, limit, sortBy, sortDirection },
    );
  }
}
