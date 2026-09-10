import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TicketMessage } from "@domain/entities/ticket-message.entity";
import { TicketMessageRepository } from "@domain/repositories/ticket-message.repository";
import { TicketMessageOrmEntity } from "../orm-entities/ticket-message.orm-entity";

@Injectable()
export class TicketMessageRepositoryImpl extends TicketMessageRepository {
  constructor(
    @InjectRepository(TicketMessageOrmEntity)
    private readonly repository: Repository<TicketMessageOrmEntity>,
  ) {
    super();
  }

  async create(message: TicketMessage): Promise<TicketMessage> {
    const saved = await this.repository.save(this.toOrm(message));
    return this.toDomain(saved);
  }

  async save(message: TicketMessage): Promise<TicketMessage> {
    const saved = await this.repository.save(this.toOrm(message));
    return this.toDomain(saved);
  }

  async findByTicketId(ticketId: string): Promise<TicketMessage[]> {
    const rows = await this.repository.find({
      where: { ticketId },
      order: { createdAt: "ASC" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: TicketMessageOrmEntity): TicketMessage {
    return TicketMessage.create({
      id: row.id,
      ticketId: row.ticketId,
      senderUserId: row.senderUserId,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toOrm(message: TicketMessage): TicketMessageOrmEntity {
    const row = new TicketMessageOrmEntity();
    row.id = message.id;
    row.ticketId = message.ticketId;
    row.senderUserId = message.senderUserId;
    row.body = message.body;
    row.createdAt = message.createdAt;
    row.updatedAt = message.updatedAt;
    return row;
  }
}
