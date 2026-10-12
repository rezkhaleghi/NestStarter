import { Injectable } from "@nestjs/common";

import { Page } from "@domain/entities/page.entity";
import { PageNotFoundException } from "@domain/exceptions/domain.exception";
import { PageRepository } from "@domain/repositories/page.repository";

@Injectable()
export class GetPageUseCase {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(id: string): Promise<Page> {
    const page = await this.pageRepository.findById(id);

    if (!page) {
      throw new PageNotFoundException();
    }

    return page;
  }
}
