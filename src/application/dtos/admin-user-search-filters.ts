import { UserRole } from "../../domain/enums/user-role.enum";
import { UserStatus } from "../../domain/enums/user-status.enum";

export interface AdminUserSearchFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
}
