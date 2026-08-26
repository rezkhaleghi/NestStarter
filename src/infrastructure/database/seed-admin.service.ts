import { Injectable, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ConfigService } from "@nestjs/config";
import { User } from "../../domain/entities/user.entity";
import { UserRole } from "../../domain/enums/user-role.enum";
import { UserRepository } from "../../domain/repositories/user.repository";
import { PasswordHasher } from "../../application/interfaces/password-hasher.interface";
import { normalizeEmail } from "../../application/utils/normalize-email";

@Injectable()
export class SeedAdminService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onModuleInit(): Promise<void> {
    const configuredEmail = this.configService.get<string>(
      "INITIAL_ADMIN_EMAIL",
    );
    const password = this.configService.get<string>("INITIAL_ADMIN_PASSWORD");
    if (!configuredEmail || !password) {
      return;
    }
    const email = normalizeEmail(configuredEmail);
    if (await this.userRepository.findByEmail(email)) {
      return;
    }

    const admin = new User(
      randomUUID(),
      email,
      await this.passwordHasher.hash(password),
      UserRole.ADMIN,
      true,
    );
    await this.userRepository.save(admin);
  }
}
