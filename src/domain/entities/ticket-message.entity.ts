import { FieldMustExistException } from "@domain/exceptions/domain.exception";
import { randomUUID } from "crypto";

export interface CreateTicketMessageProps {
  id?: string;
  ticketId: string;
  senderUserId: string;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TicketMessage {
  private constructor(
    public readonly id: string,
    public readonly ticketId: string,
    public readonly senderUserId: string,
    public body: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: CreateTicketMessageProps): TicketMessage {
    return new TicketMessage(
      props.id ?? randomUUID(),
      props.ticketId,
      props.senderUserId,
      props.body.trim(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  updateBody(body: string): void {
    const next = body.trim();
    if (!next) {
      throw new FieldMustExistException("Ticket message body");
    }
    this.body = next;
    this.updatedAt = new Date();
  }
}
