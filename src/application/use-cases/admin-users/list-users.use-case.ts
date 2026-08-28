import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { PageQuery, PageResult } from "../../dtos/page-query.input";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { AdminUserSearchFilters } from "../../dtos/admin-user-search-filters";

export interface ListUsersInput extends PageQuery<
  "createdAt" | "email" | "role"
> {
  search?: string;
  role?: UserRole;
  emailVerified?: boolean;
}

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ListUsersInput): Promise<PageResult<User>> {
    const filters: AdminUserSearchFilters = {
      search: input.search,
      role: input.role,
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
