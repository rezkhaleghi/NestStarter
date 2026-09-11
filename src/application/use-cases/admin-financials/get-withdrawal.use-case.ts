import { Injectable } from "@nestjs/common";

import { Withdrawal } from "@domain/entities/withdrawal.entity";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";
import { WithdrawalNotFoundException } from "@domain/exceptions/domain.exception";

@Injectable()
export class AdminGetWithdrawalUseCase {
  constructor(private readonly withdrawalRepository: WithdrawalRepository) {}

  async execute(id: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepository.findById(id);
    if (!withdrawal) {
      throw new WithdrawalNotFoundException();
    }
    return withdrawal;
  }
}
