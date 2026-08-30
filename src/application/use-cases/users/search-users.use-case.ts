import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { UserSearchResult } from "../../../domain/repositories/user-search-result";
import { PageQuery, PageResult } from "src/shared/pagination/page-query";

@Injectable()
export class SearchUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    query: string,
    params: PageQuery<"createdAt">,
  ): Promise<PageResult<UserSearchResult>> {
    return this.userRepository.search(query, params);
  }
}
