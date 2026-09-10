import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";

export interface CreateTicketCategoryInput {
  name: string;
  description?: string | null;
}

@Injectable()
export class CreateTicketCategoryUseCase {
  constructor(
    private readonly ticketCategoryRepository: TicketCategoryRepository,
  ) {}

  async execute(input: CreateTicketCategoryInput): Promise<TicketCategory> {
    const category = TicketCategory.create({
      id: randomUUID(),
      name: input.name,
      description: input.description,
      isActive: true,
    });

    return this.ticketCategoryRepository.create(category);
  }
}
