import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user.entity";

export interface ListUsersInput {
  page: number;
  limit: number;
}

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    input: ListUsersInput,
  ): Promise<{ data: User[]; page: number; limit: number; total: number }> {
    const offset = (input.page - 1) * input.limit;
    const [data, total] = await Promise.all([
      this.userRepository.findAll({ offset, limit: input.limit }),
      this.userRepository.count(),
    ]);

    return { data, page: input.page, limit: input.limit, total };
  }
}
