import { AdminTicketsController } from "./admin-tickets.controller";
import { TicketStatus } from "@domain/enums/ticket-status.enum";

describe("AdminTicketsController", () => {
  it("exposes admin status update route contract", async () => {
    const updateTicketStatusUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new AdminTicketsController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      updateTicketStatusUseCase as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await controller.status(
      "123e4567-e89b-12d3-a456-426614174000",
      { status: TicketStatus.IN_PROGRESS },
      {
        session: { userId: "user-1" },
      } as any,
    );

    expect(updateTicketStatusUseCase.execute).toHaveBeenCalledWith({
      actorUserId: "user-1",
      ticketId: "123e4567-e89b-12d3-a456-426614174000",
      status: TicketStatus.IN_PROGRESS,
    });
  });
});
