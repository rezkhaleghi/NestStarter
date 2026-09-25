import { TicketCategory } from "./ticket-category.entity";
import { FieldMustExistException } from "../exceptions/domain.exception";

describe("TicketCategory", () => {
  it("creates an active category with trimmed values", () => {
    const category = TicketCategory.create({
      name: "  Technical Support  ",
      description: "  Technical issues  ",
    });

    expect(category.id).toBeDefined();
    expect(category.name).toBe("Technical Support");
    expect(category.description).toBe("Technical issues");
    expect(category.isActive).toBe(true);
    expect(category.createdAt).toBeInstanceOf(Date);
    expect(category.updatedAt).toBeInstanceOf(Date);
  });

  it("preserves provided values", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");

    const category = TicketCategory.create({
      id: "category-1",
      name: "Support",
      description: null,
      isActive: false,
      createdAt,
      updatedAt,
    });

    expect(category.id).toBe("category-1");
    expect(category.name).toBe("Support");
    expect(category.description).toBeNull();
    expect(category.isActive).toBe(false);
    expect(category.createdAt).toBe(createdAt);
    expect(category.updatedAt).toBe(updatedAt);
  });

  it("updates the category fields", () => {
    const category = TicketCategory.create({
      name: "Support",
      description: "General support",
    });

    category.update({
      name: "  Technical Support  ",
      description: "  Technical issues  ",
      isActive: false,
    });

    expect(category.name).toBe("Technical Support");
    expect(category.description).toBe("Technical issues");
    expect(category.isActive).toBe(false);
  });

  it("clears the description when explicitly set to null", () => {
    const category = TicketCategory.create({
      name: "Support",
      description: "General support",
    });

    category.update({
      description: null,
    });

    expect(category.description).toBeNull();
  });

  it("does not change fields that are undefined", () => {
    const category = TicketCategory.create({
      name: "Support",
      description: "General support",
      isActive: true,
    });

    category.update({});

    expect(category.name).toBe("Support");
    expect(category.description).toBe("General support");
    expect(category.isActive).toBe(true);
  });

  it("rejects an empty category name", () => {
    const category = TicketCategory.create({
      name: "Support",
    });

    expect(() =>
      category.update({
        name: "   ",
      }),
    ).toThrow(FieldMustExistException);
  });

  it("activates a category", () => {
    const category = TicketCategory.create({
      name: "Support",
      isActive: false,
    });

    category.activate();

    expect(category.isActive).toBe(true);
  });

  it("deactivates a category", () => {
    const category = TicketCategory.create({
      name: "Support",
    });

    category.deactivate();

    expect(category.isActive).toBe(false);
  });

  it("rejects an empty category name during creation", () => {
    expect(() =>
      TicketCategory.create({
        name: "   ",
      }),
    ).toThrow(FieldMustExistException);
  });
});
