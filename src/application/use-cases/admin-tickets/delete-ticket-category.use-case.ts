import { Injectable } from "@nestjs/common";

import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";

@Injectable()
export class DeleteTicketCategoryUseCase {
  constructor(
    private readonly ticketCategoryRepository: TicketCategoryRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.ticketCategoryRepository.findById(id);
    if (!category) {
      throw new Error("Ticket category not found.");
    }

    category.deactivate();
    await this.ticketCategoryRepository.save(category);
  }
}
