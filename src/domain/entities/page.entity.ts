import { randomUUID } from "crypto";

import { InvalidPageSlugException } from "@domain/exceptions/domain.exception";
import { FieldMustExistException } from "@domain/exceptions/domain.exception";
import { PageStatus } from "@domain/enums/page-status.enum";

export interface CreatePageProps {
  id?: string;
  title: string;
  slug: string;
  content?: string;
  status?: PageStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Page {
  private constructor(
    public readonly id: string,
    public title: string,
    public slug: string,
    public content: string,
    public status: PageStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: CreatePageProps): Page {
    const title = props.title.trim();
    const slug = props.slug.trim();

    if (!title) {
      throw new FieldMustExistException("Page title");
    }

    Page.assertValidSlug(slug);

    return new Page(
      props.id ?? randomUUID(),
      title,
      slug,
      props.content ?? "",
      props.status ?? PageStatus.DRAFT,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  update(params: {
    title?: string;
    slug?: string;
    content?: string;
    status?: PageStatus;
  }): void {
    if (params.title !== undefined) {
      const title = params.title.trim();

      if (!title) {
        throw new FieldMustExistException("Page title");
      }

      this.title = title;
    }

    if (params.slug !== undefined) {
      const slug = params.slug.trim();
      Page.assertValidSlug(slug);
      this.slug = slug;
    }

    if (params.content !== undefined) {
      this.content = params.content;
    }

    if (params.status !== undefined) {
      this.status = params.status;
    }

    this.updatedAt = new Date();
  }

  publish(): void {
    this.status = PageStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  unpublish(): void {
    this.status = PageStatus.DRAFT;
    this.updatedAt = new Date();
  }

  private static assertValidSlug(slug: string): void {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new InvalidPageSlugException();
    }
  }
}
