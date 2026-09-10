import { randomUUID } from "crypto";

export interface CreateTicketCategoryProps {
  id?: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TicketCategory {
  private constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: CreateTicketCategoryProps): TicketCategory {
    return new TicketCategory(
      props.id ?? randomUUID(),
      props.name.trim(),
      props.description?.trim() ?? null,
      props.isActive ?? true,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  update(params: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }): void {
    if (params.name !== undefined) {
      const value = params.name.trim();
      if (!value) {
        throw new Error("Ticket category name cannot be empty.");
      }
      this.name = value;
    }

    if (params.description !== undefined) {
      this.description = params.description?.trim() ?? null;
    }

    if (params.isActive !== undefined) {
      this.isActive = params.isActive;
    }

    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}
