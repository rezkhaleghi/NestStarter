import { UserRole } from "../../domain/enums/user-role.enum";

/**
 * Filters available to administrators when searching users.
 *
 * These filters are separate from pagination and sorting because
 * they describe WHAT users we want, while PageQuery describes
 * HOW the results should be returned.
 */
export interface AdminUserSearchFilters {
  /**
   * Free-text search across email, username, first name and last name.
   */
  search?: string;

  /**
   * Filter users by their role.
   */
  role?: UserRole;

  /**
   * Filter users by whether their email is verified.
   */
  emailVerified?: boolean;
}
