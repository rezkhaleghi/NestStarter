import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserStatus } from "../../../domain/enums/user-status.enum";
import { AdminUserSearchFilters } from "../../../domain/repositories/admin-user-search-filters";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

export interface ListUsersInput extends PageQuery<
  "createdAt" | "email" | "role"
> {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
}

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ListUsersInput): Promise<PageResult<User>> {
    const filters: AdminUserSearchFilters = {
      search: input.search,
      role: input.role,
      status: input.status,
      emailVerified: input.emailVerified,
    };

    return this.userRepository.searchAdminUsers(filters, {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    });
  }
}
