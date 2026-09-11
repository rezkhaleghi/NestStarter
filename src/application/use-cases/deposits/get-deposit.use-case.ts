import { Injectable } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { DepositNotFoundException } from "@domain/exceptions/domain.exception";

@Injectable()
export class GetDepositUseCase {
  constructor(private readonly depositRepository: DepositRepository) {}

  async execute(id: string): Promise<Deposit> {
    const deposit = await this.depositRepository.findById(id);
    if (!deposit) {
      throw new DepositNotFoundException();
    }
    return deposit;
  }
}
