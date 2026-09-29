import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User } from "@domain/entities/user.entity";
import { UserRole } from "@domain/enums/user-role.enum";
import { UserRepository } from "@domain/repositories/user.repository";
import { PasswordHasher } from "@application/interfaces/password-hasher.interface";
import { normalizeEmail } from "@domain/utils/normalize-email";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

@Injectable()
export class SeedAdminService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onModuleInit(): Promise<void> {
    const configuredEmail = this.configService.get("INITIAL_ADMIN_EMAIL");
    const password = this.configService.get("INITIAL_ADMIN_PASSWORD");
    if (!configuredEmail || !password) {
      return;
    }
    const email = normalizeEmail(configuredEmail);
    if (await this.userRepository.findByEmail(email)) {
      return;
    }

    const admin = User.create({
      email,
      hashedPassword: await this.passwordHasher.hash(password),
      role: UserRole.ADMIN,
      emailVerified: true,
    });

    await this.userRepository.save(admin);
  }
}
