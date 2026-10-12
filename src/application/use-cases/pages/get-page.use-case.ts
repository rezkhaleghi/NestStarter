import { Injectable } from "@nestjs/common";

import { HtmlSanitizer } from "@application/interfaces/html-sanitizer.interface";
import { Page } from "@domain/entities/page.entity";
import { PageNotFoundException } from "@domain/exceptions/domain.exception";
import { PageRepository } from "@domain/repositories/page.repository";

@Injectable()
export class GetPublicPageUseCase {
  constructor(
    private readonly pageRepository: PageRepository,
    private readonly htmlSanitizer: HtmlSanitizer,
  ) {}

  async execute(slug: string): Promise<Page> {
    const page = await this.pageRepository.findPublishedBySlug(slug);

    if (!page) {
      throw new PageNotFoundException();
    }

    page.content = this.htmlSanitizer.sanitize(page.content);

    return page;
  }
}
