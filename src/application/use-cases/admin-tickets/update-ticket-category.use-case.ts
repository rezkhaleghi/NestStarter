import { Injectable } from "@nestjs/common";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";

export interface UpdateTicketCategoryInput {
  id: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

@Injectable()
export class UpdateTicketCategoryUseCase {
  constructor(
    private readonly ticketCategoryRepository: TicketCategoryRepository,
  ) {}

  async execute(input: UpdateTicketCategoryInput): Promise<TicketCategory> {
    const category = await this.ticketCategoryRepository.findById(input.id);
    if (!category) {
      throw new Error("Ticket category not found.");
    }

    category.update({
      name: input.name,
      description: input.description,
      isActive: input.isActive,
    });

    return this.ticketCategoryRepository.save(category);
  }
}
