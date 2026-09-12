import { Injectable } from "@nestjs/common";

import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { TicketCategoryNotFoundException } from "@domain/exceptions/domain.exception";

@Injectable()
export class DeleteTicketCategoryUseCase {
  constructor(
    private readonly ticketCategoryRepository: TicketCategoryRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.ticketCategoryRepository.findById(id);
    if (!category) {
      throw new TicketCategoryNotFoundException();
    }

    category.deactivate();
    await this.ticketCategoryRepository.save(category);
  }
}
