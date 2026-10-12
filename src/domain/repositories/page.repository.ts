import { Page } from "@domain/entities/page.entity";
import { PageStatus } from "@domain/enums/page-status.enum";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

export interface PageFilters {
  status?: PageStatus;
}

export abstract class PageRepository {
  abstract create(page: Page): Promise<Page>;

  abstract save(page: Page): Promise<Page>;

  abstract findById(id: string): Promise<Page | null>;

  abstract findByIdForUpdate(id: string): Promise<Page | null>;

  abstract findBySlug(slug: string): Promise<Page | null>;

  abstract findPublishedBySlug(slug: string): Promise<Page | null>;

  abstract findPage(
    filters: PageFilters,
    params: PageQuery<"createdAt" | "updatedAt" | "title">,
  ): Promise<PageResult<Page>>;

  abstract deleteById(id: string): Promise<void>;
}
