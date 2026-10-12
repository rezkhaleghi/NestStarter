import { Page } from "./page.entity";
import { PageStatus } from "@domain/enums/page-status.enum";
import {
  FieldMustExistException,
  InvalidPageSlugException,
} from "@domain/exceptions/domain.exception";

describe("Page", () => {
  it("creates a draft page with trimmed title and slug", () => {
    const page = Page.create({
      title: "  About Us  ",
      slug: "  about-us  ",
      content: "<p>Welcome</p>",
    });

    expect(page.id).toBeDefined();
    expect(page.title).toBe("About Us");
    expect(page.slug).toBe("about-us");
    expect(page.content).toBe("<p>Welcome</p>");
    expect(page.status).toBe(PageStatus.DRAFT);
    expect(page.createdAt).toBeInstanceOf(Date);
    expect(page.updatedAt).toBeInstanceOf(Date);
  });

  it("restores persisted values and timestamps", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");

    const page = Page.create({
      id: "page-id",
      title: "About Us",
      slug: "about-us",
      content: "<p>Welcome</p>",
      status: PageStatus.PUBLISHED,
      createdAt,
      updatedAt,
    });

    expect(page.id).toBe("page-id");
    expect(page.status).toBe(PageStatus.PUBLISHED);
    expect(page.createdAt).toBe(createdAt);
    expect(page.updatedAt).toBe(updatedAt);
  });

  it("rejects an empty title", () => {
    expect(() =>
      Page.create({
        title: "   ",
        slug: "about-us",
      }),
    ).toThrow(FieldMustExistException);
  });

  it.each([
    "About Us",
    "/about-us",
    "about_us",
    "about--us",
    "-about",
    "about-",
    "About",
    "",
  ])("rejects invalid slug %s", (slug) => {
    expect(() =>
      Page.create({
        title: "About Us",
        slug,
      }),
    ).toThrow(InvalidPageSlugException);
  });

  it.each(["about", "about-us", "faq2", "terms-and-conditions"])(
    "accepts valid slug %s",
    (slug) => {
      expect(
        Page.create({
          title: "Test page",
          slug,
        }).slug,
      ).toBe(slug);
    },
  );

  it("updates provided fields without changing omitted fields", () => {
    const page = Page.create({
      title: "About Us",
      slug: "about-us",
      content: "<p>Old content</p>",
    });

    page.update({
      title: "  Our Story ",
      content: "<p>New content</p>",
    });

    expect(page.title).toBe("Our Story");
    expect(page.slug).toBe("about-us");
    expect(page.content).toBe("<p>New content</p>");
  });

  it("updates the slug after validating it", () => {
    const page = Page.create({
      title: "About Us",
      slug: "about-us",
    });

    page.update({ slug: "our-story" });

    expect(page.slug).toBe("our-story");
  });

  it("rejects an invalid slug during update", () => {
    const page = Page.create({
      title: "About Us",
      slug: "about-us",
    });

    expect(() => page.update({ slug: "About_Us" })).toThrow(
      InvalidPageSlugException,
    );

    expect(page.slug).toBe("about-us");
  });

  it("rejects an empty title during update", () => {
    const page = Page.create({
      title: "About Us",
      slug: "about-us",
    });

    expect(() => page.update({ title: "   " })).toThrow(
      FieldMustExistException,
    );

    expect(page.title).toBe("About Us");
  });

  it("publishes and unpublishes a page", () => {
    const page = Page.create({
      title: "About Us",
      slug: "about-us",
    });

    page.publish();
    expect(page.status).toBe(PageStatus.PUBLISHED);

    page.unpublish();
    expect(page.status).toBe(PageStatus.DRAFT);
  });
});
