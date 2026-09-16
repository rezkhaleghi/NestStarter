import { Ticket } from "./ticket.entity";
import { TicketPriority } from "../enums/ticket-priority.enum";
import { TicketStatus } from "../enums/ticket-status.enum";
import { FieldMustExistException } from "../exceptions/domain.exception";

describe("Ticket", () => {
  it("allows a normal status flow from open to resolved to closed", () => {
    const ticket = Ticket.create({
      userId: "user-1",
      subject: "Login issue",
    });

    ticket.setStatus(TicketStatus.IN_PROGRESS);
    ticket.setStatus(TicketStatus.WAITING_FOR_USER);
    ticket.setStatus(TicketStatus.IN_PROGRESS);
    ticket.setStatus(TicketStatus.RESOLVED);
    ticket.setStatus(TicketStatus.CLOSED);

    expect(ticket.status).toBe(TicketStatus.CLOSED);
  });

  it("rejects an invalid transition", () => {
    const ticket = Ticket.create({
      userId: "user-1",
      subject: "Login issue",
      priority: TicketPriority.HIGH,
    });

    expect(() => ticket.setStatus(TicketStatus.RESOLVED)).toThrow(
      "Invalid ticket status transition",
    );
  });

  it("rejects an empty subject", () => {
    expect(() =>
      Ticket.create({
        userId: "user-1",
        subject: "   ",
      }),
    ).toThrow(FieldMustExistException);
  });

  it("assigns and unassigns a ticket", () => {
    const ticket = Ticket.create({
      userId: "user-1",
      subject: "Login issue",
    });

    ticket.assignTo("admin-1");
    expect(ticket.assignedToUserId).toBe("admin-1");

    ticket.assignTo(null);
    expect(ticket.assignedToUserId).toBeNull();
  });

  it("changes ticket priority", () => {
    const ticket = Ticket.create({
      userId: "user-1",
      subject: "Login issue",
    });

    ticket.setPriority(TicketPriority.HIGH);

    expect(ticket.priority).toBe(TicketPriority.HIGH);
  });

  it("sets closedAt when a ticket is resolved", () => {
    const ticket = Ticket.create({
      userId: "user-1",
      subject: "Login issue",
    });

    ticket.setStatus(TicketStatus.IN_PROGRESS);
    ticket.setStatus(TicketStatus.RESOLVED);

    expect(ticket.closedAt).toBeInstanceOf(Date);
  });

  it("preserves an existing closedAt when resolved", () => {
    const closedAt = new Date("2026-01-01T00:00:00.000Z");

    const ticket = Ticket.create({
      userId: "user-1",
      subject: "Login issue",
      status: TicketStatus.IN_PROGRESS,
      closedAt,
    });

    ticket.setStatus(TicketStatus.RESOLVED);

    expect(ticket.closedAt).toBe(closedAt);
  });

  it("clears closedAt when a resolved ticket is reopened", () => {
    const ticket = Ticket.create({
      userId: "user-1",
      subject: "Login issue",
    });

    ticket.setStatus(TicketStatus.IN_PROGRESS);
    ticket.setStatus(TicketStatus.RESOLVED);

    expect(ticket.closedAt).toBeInstanceOf(Date);

    ticket.setStatus(TicketStatus.IN_PROGRESS);

    expect(ticket.closedAt).toBeNull();
  });

  it("can receive replies unless closed", () => {
    const ticket = Ticket.create({
      userId: "user-1",
      subject: "Login issue",
    });

    expect(ticket.canReceiveReply()).toBe(true);

    ticket.setStatus(TicketStatus.CLOSED);

    expect(ticket.canReceiveReply()).toBe(false);
  });
});
