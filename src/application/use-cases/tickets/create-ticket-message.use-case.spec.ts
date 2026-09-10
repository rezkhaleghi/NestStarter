import { CreateTicketMessageUseCase } from "./create-ticket-message.use-case";
import { TicketStatus } from "@domain/enums/ticket-status.enum";
import { Ticket } from "@domain/entities/ticket.entity";

describe("CreateTicketMessageUseCase", () => {
  it("moves a waiting-for-user ticket back to in progress when the user replies", async () => {
    const ticket = Ticket.create({ userId: "user-1", subject: "Login" });
    ticket.setStatus(TicketStatus.IN_PROGRESS);
    ticket.setStatus(TicketStatus.WAITING_FOR_USER);
    const unitOfWork = {
      execute: jest.fn(async (work) =>
        work({
          ticketRepository: {
            findByIdForUpdate: jest.fn().mockResolvedValue(ticket),
            save: jest.fn().mockImplementation(async (updated) => updated),
          },
          ticketMessageRepository: {
            create: jest.fn().mockImplementation(async (message) => message),
          },
          auditLogRepository: {
            create: jest.fn().mockResolvedValue(undefined),
          },
        }),
      ),
    };

    const result = await new CreateTicketMessageUseCase(
      unitOfWork as any,
    ).execute({
      userId: "user-1",
      ticketId: ticket.id,
      body: "I fixed it.",
    });

    expect(result.body).toBe("I fixed it.");
    expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
  });
});
