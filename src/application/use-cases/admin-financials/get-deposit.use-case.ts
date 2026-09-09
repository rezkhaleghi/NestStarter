import { Injectable } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { DepositRepository } from "@domain/repositories/deposit.repository";

@Injectable()
export class AdminGetDepositUseCase {
  constructor(private readonly depositRepository: DepositRepository) {}

  async execute(id: string): Promise<Deposit> {
    const deposit = await this.depositRepository.findById(id);
    if (!deposit) {
      throw new Error("Deposit not found.");
    }
    return deposit;
  }
}
