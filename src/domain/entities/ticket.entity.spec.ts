import { Ticket } from "./ticket.entity";
import { TicketPriority } from "../enums/ticket-priority.enum";
import { TicketStatus } from "../enums/ticket-status.enum";

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
});
