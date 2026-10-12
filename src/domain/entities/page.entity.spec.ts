import { describe, expect, it } from "@jest/globals";

import { Page } from "./page.entity";
import { PageStatus } from "@domain/enums/page-status.enum";
import {
  FieldMustExistException,
  InvalidPageSlugException,
} from "@domain/exceptions/domain.exception";

describe("Page", () => {
  it("creates a draft page by default and trims title", () => {
    const page = Page.create({
      title: " About Us ",
      slug: "about-us",
    });

    expect(page.id).toBeTruthy();
    expect(page.title).toBe("About Us");
    expect(page.slug).toBe("about-us");
    expect(page.content).toBe("");
    expect(page.status).toBe(PageStatus.DRAFT);
    expect(page.createdAt).toBeInstanceOf(Date);
    expect(page.updatedAt).toBeInstanceOf(Date);
  });

  it("restores persistence data without regenerating timestamps", () => {
    const createdAt = new Date("2025-01-01T00:00:00.000Z");
    const updatedAt = new Date("2025-02-01T00:00:00.000Z");

    const page = Page.restore({
      id: "page-id",
      title: "About",
      slug: "about",
      content: "<p>About</p>",
      status: PageStatus.PUBLISHED,
      createdAt,
      updatedAt,
    });

    expect(page.id).toBe("page-id");
    expect(page.createdAt).toBe(createdAt);
    expect(page.updatedAt).toBe(updatedAt);
    expect(page.status).toBe(PageStatus.PUBLISHED);
  });

  it("rejects an empty title", () => {
    expect(() => Page.create({ title: "  ", slug: "about" })).toThrow(
      FieldMustExistException,
    );
  });

  it.each([
    "",
    "-about",
    "about-",
    "About",
    "about us",
    "about--us",
    "about_us",
    "about/us",
  ])("rejects invalid slug %j", (slug) => {
    expect(() => Page.create({ title: "About", slug })).toThrow(
      InvalidPageSlugException,
    );
  });

  it.each(["about", "about-us", "faq2", "terms-and-conditions"])(
    "accepts valid slug %j",
    (slug) => {
      expect(Page.create({ title: "Page", slug }).slug).toBe(slug);
    },
  );

  it("updates supplied fields and leaves omitted fields unchanged", () => {
    const page = Page.create({
      title: "About",
      slug: "about",
      content: "Old",
    });
    const oldCreatedAt = page.createdAt;

    page.update({ title: "About Us", content: "New" });

    expect(page.title).toBe("About Us");
    expect(page.slug).toBe("about");
    expect(page.content).toBe("New");
    expect(page.createdAt).toBe(oldCreatedAt);
    expect(page.updatedAt.getTime()).toBeGreaterThanOrEqual(
      oldCreatedAt.getTime(),
    );
  });

  it("does not partially update when validation fails", () => {
    const page = Page.create({
      title: "Original",
      slug: "original",
      content: "Original content",
    });

    expect(() =>
      page.update({ title: "Changed", slug: "INVALID SLUG" }),
    ).toThrow(InvalidPageSlugException);

    expect(page.title).toBe("Original");
    expect(page.slug).toBe("original");
  });

  it("publishes and unpublishes a page", () => {
    const page = Page.create({ title: "FAQ", slug: "faq" });

    page.publish();
    expect(page.status).toBe(PageStatus.PUBLISHED);

    page.unpublish();
    expect(page.status).toBe(PageStatus.DRAFT);
  });
});
