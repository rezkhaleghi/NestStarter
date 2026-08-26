import { Injectable, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ConfigService } from "@nestjs/config";
import { User } from "../../domain/entities/user.entity";
import { UserRole } from "../../domain/enums/user-role.enum";
import { UserRepository } from "../../domain/repositories/user.repository";
import { PasswordHasher } from "../../application/interfaces/password-hasher.interface";

@Injectable()
export class SeedAdminService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.configService.get<string>("INITIAL_ADMIN_EMAIL");
    const password = this.configService.get<string>("INITIAL_ADMIN_PASSWORD");
    if (!email || !password || (await this.userRepository.findByEmail(email))) {
      return;
    }

    const admin = new User(
      randomUUID(),
      email.toLowerCase(),
      await this.passwordHasher.hash(password),
      UserRole.ADMIN,
    );
    await this.userRepository.save(admin);
  }
}
