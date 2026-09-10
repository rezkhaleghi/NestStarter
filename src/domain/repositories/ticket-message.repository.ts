import { TicketMessage } from "../entities/ticket-message.entity";

export abstract class TicketMessageRepository {
  abstract create(message: TicketMessage): Promise<TicketMessage>;
  abstract save(message: TicketMessage): Promise<TicketMessage>;
  abstract findByTicketId(ticketId: string): Promise<TicketMessage[]>;
}
