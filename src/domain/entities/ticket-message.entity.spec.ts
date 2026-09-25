import { TicketMessage } from "./ticket-message.entity";
import { FieldMustExistException } from "../exceptions/domain.exception";

describe("TicketMessage", () => {
  it("creates a message and trims the body", () => {
    const message = TicketMessage.create({
      ticketId: "ticket-1",
      senderUserId: "user-1",
      body: "  Hello support  ",
    });

    expect(message.id).toBeDefined();
    expect(message.ticketId).toBe("ticket-1");
    expect(message.senderUserId).toBe("user-1");
    expect(message.body).toBe("Hello support");
    expect(message.createdAt).toBeInstanceOf(Date);
    expect(message.updatedAt).toBeInstanceOf(Date);
  });

  it("preserves provided id and dates", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");

    const message = TicketMessage.create({
      id: "message-1",
      ticketId: "ticket-1",
      senderUserId: "user-1",
      body: "Hello",
      createdAt,
      updatedAt,
    });

    expect(message.id).toBe("message-1");
    expect(message.createdAt).toBe(createdAt);
    expect(message.updatedAt).toBe(updatedAt);
  });

  it("updates and trims the message body", () => {
    const message = TicketMessage.create({
      ticketId: "ticket-1",
      senderUserId: "user-1",
      body: "Original message",
    });

    message.updateBody("  Updated message  ");

    expect(message.body).toBe("Updated message");
  });

  it("rejects an empty updated body", () => {
    const message = TicketMessage.create({
      ticketId: "ticket-1",
      senderUserId: "user-1",
      body: "Original message",
    });

    expect(() => message.updateBody("   ")).toThrow(FieldMustExistException);
  });

  it("rejects an empty body during creation", () => {
    expect(() =>
      TicketMessage.create({
        ticketId: "ticket-1",
        senderUserId: "user-1",
        body: "   ",
      }),
    ).toThrow(FieldMustExistException);
  });
});
