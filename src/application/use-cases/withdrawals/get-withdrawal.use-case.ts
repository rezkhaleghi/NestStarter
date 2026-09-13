import { Injectable } from "@nestjs/common";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { WithdrawalNotFoundException } from "@domain/exceptions/domain.exception";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";

@Injectable()
export class GetWithdrawalUseCase {
  constructor(private readonly withdrawalRepository: WithdrawalRepository) {}

  async execute(id: string, userId: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepository.findByUserIdAndId(
      userId,
      id,
    );

    if (!withdrawal) {
      throw new WithdrawalNotFoundException();
    }

    return withdrawal;
  }
}
