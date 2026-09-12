import { randomUUID } from "crypto";

import { TicketPriority } from "../enums/ticket-priority.enum";
import { TicketStatus } from "../enums/ticket-status.enum";
import { FieldMustExistException } from "@domain/exceptions/domain.exception";

export interface CreateTicketProps {
  id?: string;
  userId: string;
  categoryId?: string | null;
  subject: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToUserId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  closedAt?: Date | null;
}

export class Ticket {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public categoryId: string | null,
    public subject: string,
    public status: TicketStatus,
    public priority: TicketPriority,
    public assignedToUserId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public closedAt: Date | null,
  ) {}

  static create(props: CreateTicketProps): Ticket {
    const subject = props.subject.trim();
    if (!subject) {
      throw new FieldMustExistException("Ticket subject");
    }

    return new Ticket(
      props.id ?? randomUUID(),
      props.userId,
      props.categoryId ?? null,
      subject,
      props.status ?? TicketStatus.OPEN,
      props.priority ?? TicketPriority.NORMAL,
      props.assignedToUserId ?? null,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.closedAt ?? null,
    );
  }

  assignTo(userId: string | null): void {
    this.assignedToUserId = userId;
    this.updatedAt = new Date();
  }

  setPriority(priority: TicketPriority): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }

  setStatus(status: TicketStatus): void {
    this.assertValidTransition(this.status, status);
    this.status = status;
    this.updatedAt = new Date();

    if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
      this.closedAt ??= new Date();
      return;
    }

    if (
      status === TicketStatus.OPEN ||
      status === TicketStatus.IN_PROGRESS ||
      status === TicketStatus.WAITING_FOR_USER ||
      status === TicketStatus.WAITING_FOR_SUPPORT
    ) {
      this.closedAt = null;
    }
  }

  canReceiveReply(): boolean {
    return this.status !== TicketStatus.CLOSED;
  }

  private assertValidTransition(
    current: TicketStatus,
    next: TicketStatus,
  ): void {
    const allowed: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.WAITING_FOR_SUPPORT,
        TicketStatus.CLOSED,
      ],
      [TicketStatus.IN_PROGRESS]: [
        TicketStatus.WAITING_FOR_USER,
        TicketStatus.WAITING_FOR_SUPPORT,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
      ],
      [TicketStatus.WAITING_FOR_USER]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
      ],
      [TicketStatus.WAITING_FOR_SUPPORT]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
      ],
      [TicketStatus.RESOLVED]: [
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.CLOSED,
      ],
      [TicketStatus.CLOSED]: [
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
      ],
    };

    if (!allowed[current]?.includes(next)) {
      throw new Error(
        `Invalid ticket status transition from ${current} to ${next}.`,
      );
    }
  }
}
