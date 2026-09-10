import { TicketCategory } from "../entities/ticket-category.entity";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export abstract class TicketCategoryRepository {
  abstract create(category: TicketCategory): Promise<TicketCategory>;
  abstract save(category: TicketCategory): Promise<TicketCategory>;
  abstract findById(id: string): Promise<TicketCategory | null>;
  abstract findPage(
    params: PageQuery<"createdAt" | "name">,
  ): Promise<PageResult<TicketCategory>>;
  abstract findAll(): Promise<TicketCategory[]>;
  abstract deleteById(id: string): Promise<void>;
}
