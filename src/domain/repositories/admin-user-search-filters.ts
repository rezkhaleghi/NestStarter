import { UserRole } from "../enums/user-role.enum";
import { UserStatus } from "../enums/user-status.enum";

export interface AdminUserSearchFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
}
