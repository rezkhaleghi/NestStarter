import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserStatus } from "@domain/enums/user-status.enum";

/**
 * ORM entity — TypeORM-specific shape of a user row.
 * This is DELIBERATELY separate from the domain User entity.
 * The domain never imports this file.
 */
@Entity("users")
@Index(["createdAt"])
@Index(["role"])
@Index(["status"])
@Index(["emailVerified"])
export class UserOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, type: "varchar" })
  hashedPassword: string | null;

  @Column({ nullable: true, unique: true, type: "varchar" })
  googleId: string | null;

  @Column({ nullable: true, type: "varchar" })
  firstName: string | null;

  @Column({ nullable: true, type: "varchar" })
  lastName: string | null;

  @Column({ nullable: true, unique: true, type: "varchar" })
  userName: string | null;

  @Column({ nullable: true, type: "date" })
  dateOfBirth: Date | null;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: "varchar" })
  avatar: string | null;

  @Column({ nullable: true, type: "varchar" })
  bio: string | null;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;
}
