import { Column, Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { UserRole } from '../../../domain/enums/user-role.enum';

/**
 * ORM entity — TypeORM-specific shape of a user row.
 * This is DELIBERATELY separate from the domain User entity.
 * The domain never imports this file.
 */
@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, type: 'varchar' })
  hashedPassword: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
