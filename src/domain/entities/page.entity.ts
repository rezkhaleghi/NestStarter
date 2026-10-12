import { randomUUID } from "crypto";

import { PageStatus } from "@domain/enums/page-status.enum";
import {
  FieldMustExistException,
  InvalidPageSlugException,
  InvalidPageStatusException,
} from "@domain/exceptions/domain.exception";

export interface CreatePageProps {
  id?: string;
  title: string;
  slug: string;
  content?: string;
  status?: PageStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestorePageProps {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePageProps {
  title?: string;
  slug?: string;
  content?: string;
  status?: PageStatus;
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

    const now = new Date();

    return new Page(
      props.id ?? randomUUID(),
      title,
      slug,
      props.content ?? "",
      props.status ?? PageStatus.DRAFT,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  static restore(props: RestorePageProps): Page {
    const title = props.title.trim();
    const slug = props.slug.trim();

    if (!title) {
      throw new FieldMustExistException("Page title");
    }

    Page.assertValidSlug(slug);

    return new Page(
      props.id,
      title,
      slug,
      props.content,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  update(params: UpdatePageProps): void {
    // Validate all supplied values before mutating any entity state.
    const title = params.title === undefined ? undefined : params.title.trim();
    const slug = params.slug === undefined ? undefined : params.slug.trim();

    if (title !== undefined && !title) {
      throw new FieldMustExistException("Page title");
    }

    if (slug !== undefined) {
      Page.assertValidSlug(slug);
    }

    if (
      params.status !== undefined &&
      !Object.values(PageStatus).includes(params.status)
    ) {
      throw new Error("Invalid page status.");
    }

    if (title !== undefined) this.title = title;
    if (slug !== undefined) this.slug = slug;
    if (params.content !== undefined) this.content = params.content;
    if (params.status !== undefined) this.status = params.status;

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

  // todo
  private static assertValidStatus(status: PageStatus): void {
    if (!Object.values(PageStatus).includes(status)) {
      throw new InvalidPageStatusException();
    }
  }
}
