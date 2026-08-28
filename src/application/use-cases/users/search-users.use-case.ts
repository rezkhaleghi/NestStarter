import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { PageQuery, PageResult } from "../../dtos/page-query.input";
import { UserSearchResult } from "../../dtos/user-search-result";

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
