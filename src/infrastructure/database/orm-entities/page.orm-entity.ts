import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { PageStatus } from "@domain/enums/page-status.enum";

@Entity("pages")
@Index("IDX_pages_status", ["status"])
@Index("UQ_pages_slug", ["slug"], { unique: true })
export class PageOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 160 })
  slug!: string;

  @Column({ type: "text", default: "" })
  content!: string;

  @Column({
    type: "enum",
    enum: PageStatus,
    enumName: "pages_status_enum",
    default: PageStatus.DRAFT,
  })
  status!: PageStatus;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
