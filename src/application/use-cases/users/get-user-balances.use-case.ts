import { Injectable } from "@nestjs/common";

import { UserBalance } from "../../../domain/entities/user-balance.entity";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { UserBalanceRepository } from "../../../domain/repositories/user-balance.repository";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { PageQuery, PageResult } from "../../../shared/pagination/page-query";

@Injectable()
export class GetUserBalancesUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBalanceRepository: UserBalanceRepository,
  ) {}

  async execute(
    userId: string,
    query: PageQuery<"currency" | "amount" | "createdAt">,
  ): Promise<PageResult<UserBalance>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    return this.userBalanceRepository.findByUserId(userId, query);
  }
}
