import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user.entity";
import { PageQuery, PageResult } from "../../dtos/page-query.input";

export type ListUsersInput = PageQuery<"createdAt" | "email" | "role">;

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ListUsersInput): Promise<PageResult<User>> {
    return this.userRepository.findPage(input);
  }
}
